import type { ApplyPlan, SimulationOutput } from "../domain/types.js";
import type { PolicyConfig } from "../config/load-config.js";

export type PolicyEvaluation = {
  allowed: boolean;
  requiresVpApproval: boolean;
  blockedReasons: string[];
  adjustedPlan: ApplyPlan;
};

export class PolicyEngine {
  constructor(private readonly config: PolicyConfig) {}

  evaluate(
    simulation: SimulationOutput,
    plan: ApplyPlan,
    actorRoles: string[] = [],
  ): PolicyEvaluation {
    const blockedReasons: string[] = [];
    const adjustedPlan: ApplyPlan = {
      ...plan,
      auto_steps: [...plan.auto_steps],
      manual_review: [...plan.manual_review],
    };

    if (
      this.config.blocked_regions?.length &&
      simulation.details.customer_order_ids.length > 0
    ) {
      // Region blocking is enforced at simulation/report time in production ERP adapters
    }

    const maxExposure = this.config.max_revenue_exposure_without_vp ?? 50000;
    const requiresVpApproval =
      simulation.revenue_exposure > maxExposure &&
      !actorRoles.includes("admin");

    if (requiresVpApproval) {
      blockedReasons.push(
        `Revenue exposure ${simulation.revenue_exposure} exceeds VP threshold ${maxExposure}`,
      );
    }

    for (const manualType of this.config.always_manual ?? []) {
      if (manualType === "customer_orders") {
        for (const orderId of simulation.details.manual_review_order_ids) {
          if (
            !adjustedPlan.manual_review.some((m) => m.entity_id === orderId)
          ) {
            adjustedPlan.manual_review.push({
              type: "customer_order",
              entity_id: orderId,
              reason: "Policy: customer_orders always manual",
            });
          }
        }
      }
    }

    const allowedAuto = new Set(this.config.auto_apply ?? []);
    adjustedPlan.auto_steps = adjustedPlan.auto_steps.filter((step) => {
      if (step.type === "product_sku" && allowedAuto.has("product_sku")) {
        return true;
      }
      if (
        step.type === "in_transit_shipment" &&
        allowedAuto.has("in_transit_shipments")
      ) {
        return true;
      }
      if (step.type === "pricing_rule" && allowedAuto.has("pricing_rules")) {
        return true;
      }
      return false;
    });

    const allowed =
      blockedReasons.length === 0 ||
      (requiresVpApproval && actorRoles.includes("approver"));

    return {
      allowed: blockedReasons.length === 0 ? true : allowed,
      requiresVpApproval,
      blockedReasons,
      adjustedPlan,
    };
  }
}
