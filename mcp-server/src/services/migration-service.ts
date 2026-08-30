import { randomUUID } from "node:crypto";
import type {
  ApplyPlan,
  MigrationJob,
  MigrationJobStatus,
  MigrationStep,
  RequestContext,
  SimulationOutput,
} from "../domain/types.js";
import { getPool } from "../db/pool.js";
import { getDataSource } from "../adapters/factory.js";
import {
  loadPolicyConfig,
  loadRippleConfig,
} from "../config/load-config.js";
import { PolicyEngine } from "./policy-engine.js";
import { ImpactService } from "./impact-service.js";
import { exportAuditEvent } from "../observability/audit-export.js";

export class MigrationService {
  private impact = new ImpactService();
  private policy = new PolicyEngine(loadPolicyConfig(loadRippleConfig()));

  async createJob(
    oldSku: string,
    newSku: string,
    simulation: SimulationOutput,
    plan: ApplyPlan,
    ctx: RequestContext,
  ): Promise<{ success: true; job: MigrationJob } | { success: false; error: string }> {
    const evaluation = this.policy.evaluate(simulation, plan, ctx.roles ?? []);
    if (!evaluation.allowed) {
      return {
        success: false,
        error: evaluation.blockedReasons.join("; ") || "Policy blocked job creation",
      };
    }

    const idempotencyKey =
      ctx.idempotencyKey ?? `job-${oldSku}-${newSku}-${randomUUID()}`;

    const existing = await getPool().query<MigrationJob>(
      "SELECT * FROM migration_jobs WHERE idempotency_key = $1",
      [idempotencyKey],
    );
    if (existing.rows[0]) {
      return { success: true, job: existing.rows[0] };
    }

    const result = await getPool().query<MigrationJob>(
      `INSERT INTO migration_jobs
        (status, old_sku, new_sku, plan_json, simulation_json, created_by, idempotency_key)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
       RETURNING *`,
      [
        "pending_approval",
        oldSku,
        newSku,
        JSON.stringify(evaluation.adjustedPlan),
        JSON.stringify(simulation),
        ctx.actor ?? null,
        idempotencyKey,
      ],
    );

    const job = result.rows[0];
    for (const step of evaluation.adjustedPlan.auto_steps) {
      await getPool().query(
        `INSERT INTO migration_steps (job_id, step_type, entity_id, status)
         VALUES ($1, $2, $3, 'pending')`,
        [job.job_id, step.type, String(step.entity_id)],
      );
    }
    for (const manual of evaluation.adjustedPlan.manual_review) {
      await getPool().query(
        `INSERT INTO migration_steps (job_id, step_type, entity_id, status)
         VALUES ($1, $2, $3, 'skipped')`,
        [job.job_id, manual.type, String(manual.entity_id)],
      );
    }

    return { success: true, job };
  }

  async approveJob(
    jobId: number,
    ctx: RequestContext,
  ): Promise<{ success: true; job: MigrationJob } | { success: false; error: string }> {
    if (!ctx.roles?.includes("approver") && !ctx.roles?.includes("admin")) {
      return { success: false, error: "Approver role required" };
    }

    const result = await getPool().query<MigrationJob>(
      `UPDATE migration_jobs
       SET status = 'approved', approved_by = $2, updated_at = now()
       WHERE job_id = $1 AND status = 'pending_approval'
       RETURNING *`,
      [jobId, ctx.actor ?? null],
    );

    if (!result.rows[0]) {
      return { success: false, error: "Job not found or not pending approval" };
    }
    return { success: true, job: result.rows[0] };
  }

  async executeJob(
    jobId: number,
    ctx: RequestContext,
  ): Promise<{ success: true; job: MigrationJob; apply: unknown } | { success: false; error: string }> {
    const jobResult = await getPool().query<MigrationJob>(
      "SELECT * FROM migration_jobs WHERE job_id = $1",
      [jobId],
    );
    const job = jobResult.rows[0];
    if (!job) return { success: false, error: "Job not found" };
    if (job.status !== "approved") {
      return { success: false, error: `Job status is ${job.status}, expected approved` };
    }

    await getPool().query(
      "UPDATE migration_jobs SET status = 'executing', updated_at = now() WHERE job_id = $1",
      [jobId],
    );

    const plan = job.plan_json as ApplyPlan;
    const dataSource = getDataSource();
    const apply = await dataSource.applySkuMigration(plan, {
      ...ctx,
      idempotencyKey: job.idempotency_key ?? undefined,
    });

    if (!apply.success) {
      await getPool().query(
        "UPDATE migration_jobs SET status = 'failed', updated_at = now() WHERE job_id = $1",
        [jobId],
      );
      return { success: false, error: apply.error };
    }

    await getPool().query(
      `UPDATE audit_log SET job_id = $1 WHERE audit_id = $2`,
      [jobId, apply.audit_id],
    );

    await getPool().query(
      `UPDATE migration_steps SET status = 'completed'
       WHERE job_id = $1 AND status = 'pending'`,
      [jobId],
    );

    await getPool().query(
      "UPDATE migration_jobs SET status = 'completed', updated_at = now() WHERE job_id = $1",
      [jobId],
    );

    await exportAuditEvent({
      audit_id: apply.audit_id,
      job_id: jobId,
      action: "migration_job_completed",
      actor: ctx.actor,
    });

    const updated = await getPool().query<MigrationJob>(
      "SELECT * FROM migration_jobs WHERE job_id = $1",
      [jobId],
    );

    return { success: true, job: updated.rows[0], apply };
  }

  async getJob(jobId: number): Promise<MigrationJob | null> {
    const result = await getPool().query<MigrationJob>(
      "SELECT * FROM migration_jobs WHERE job_id = $1",
      [jobId],
    );
    return result.rows[0] ?? null;
  }

  async getJobSteps(jobId: number): Promise<MigrationStep[]> {
    const result = await getPool().query<MigrationStep>(
      "SELECT * FROM migration_steps WHERE job_id = $1 ORDER BY step_id",
      [jobId],
    );
    return result.rows;
  }
}
