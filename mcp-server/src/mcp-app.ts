import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { AuthenticatedRequest } from "./middleware/security.js";
import {
  authMiddleware,
  correlationMiddleware,
  oidcActorMiddleware,
  rateLimitMiddleware,
  requestLogMiddleware,
} from "./middleware/security.js";
import { ImpactService } from "./services/impact-service.js";
import { MigrationService } from "./services/migration-service.js";
import {
  incrementCounter,
  recordHistogram,
  getMetricsSnapshot,
} from "./observability/telemetry.js";
import type { ApplyPlan, RequestContext } from "./domain/types.js";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function ctxFromReq(req: AuthenticatedRequest): RequestContext {
  return {
    actor: req.actor,
    correlationId: req.correlationId,
    roles: req.roles,
    readOnly: process.env.RIPPLE_READ_ONLY === "true",
  };
}

function createRippleMcpServer(
  impact: ImpactService,
  migration: MigrationService,
  req: AuthenticatedRequest,
): McpServer {
  const server = new McpServer({
    name: "ripple-mcp",
    version: "0.2.0",
  });

  const baseCtx = () => ctxFromReq(req);

  server.registerTool(
    "get_product",
    {
      description:
        "Fetch a product from the operational catalog by SKU or product_id.",
      inputSchema: {
        sku: z.string().optional().describe("Stock keeping unit code"),
        product_id: z.number().int().optional().describe("Numeric product id"),
      },
    },
    async ({ sku, product_id }) => {
      if (!sku && product_id === undefined) {
        return toolError("Provide sku or product_id.");
      }
      if (sku && product_id !== undefined) {
        return toolError("Provide only one of sku or product_id.");
      }
      const start = Date.now();
      const product = await impact.getProduct({ sku, product_id });
      recordHistogram("mcp_tool_duration_ms", Date.now() - start, {
        tool: "get_product",
      });
      if (!product) return toolError("Product not found.");
      incrementCounter("mcp_tool_calls", { tool: "get_product" });
      return jsonResult(product);
    },
  );

  const findTool = (
    name: string,
    description: string,
    fn: (productId: number) => Promise<unknown>,
  ) => {
    server.registerTool(
      name,
      {
        description,
        inputSchema: {
          product_id: z
            .number()
            .int()
            .describe("Product id from products table"),
        },
      },
      async ({ product_id }) => {
        const start = Date.now();
        const data = await fn(product_id);
        recordHistogram("mcp_tool_duration_ms", Date.now() - start, {
          tool: name,
        });
        incrementCounter("mcp_tool_calls", { tool: name });
        return jsonResult(data);
      },
    );
  };

  findTool(
    "find_purchase_orders",
    "List purchase orders referencing a product_id.",
    (id) => impact.findPurchaseOrders(id),
  );
  findTool(
    "find_shipments",
    "List shipments referencing a product_id.",
    (id) => impact.findShipments(id),
  );
  findTool(
    "find_customer_orders",
    "List customer orders referencing a product_id.",
    (id) => impact.findCustomerOrders(id),
  );
  findTool(
    "find_pricing_rules",
    "List pricing rules for a product_id.",
    (id) => impact.findPricingRules(id),
  );

  server.registerTool(
    "apply_product_update",
    {
      description:
        "Apply safe SKU migration: update products.sku and flag in-transit shipments. Requires explicit user approval.",
      annotations: { destructiveHint: true, readOnlyHint: false },
      inputSchema: {
        old_sku: z.string(),
        new_sku: z.string(),
        actor: z.string().optional(),
      },
    },
    async ({ old_sku, new_sku, actor }) => {
      const ctx = { ...baseCtx(), actor: actor ?? baseCtx().actor };
      const result = await impact.applyProductUpdate(old_sku, new_sku, ctx);
      if (!result.success) return toolError(result.error);
      incrementCounter("apply_success_total");
      return jsonResult(result);
    },
  );

  server.registerTool(
    "get_audit_log",
    {
      description: "Fetch audit log entries by audit_id or recent limit.",
      annotations: { readOnlyHint: true },
      inputSchema: {
        audit_id: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ audit_id, limit }) => {
      if (audit_id === undefined && limit === undefined) {
        return jsonResult(await impact.getAuditLog({ limit: 10 }));
      }
      if (audit_id !== undefined) {
        return jsonResult(await impact.getAuditLog({ audit_id }));
      }
      return jsonResult(await impact.getAuditLog({ limit }));
    },
  );

  server.registerTool(
    "create_migration_job",
    {
      description:
        "Create a migration job from simulation output and apply plan. Policy evaluated before persist.",
      inputSchema: {
        old_sku: z.string(),
        new_sku: z.string(),
        simulation_json: z.string().describe("JSON string from simulate_change.py"),
        plan_json: z.string().optional().describe("Optional ApplyPlan JSON"),
      },
    },
    async ({ old_sku, new_sku, simulation_json, plan_json }) => {
      const simulation = JSON.parse(simulation_json);
      const product = await impact.getProduct({ sku: old_sku });
      if (!product) return toolError("Product not found");
      const plan: ApplyPlan = plan_json
        ? JSON.parse(plan_json)
        : impact.buildApplyPlan(simulation, product);
      const result = await migration.createJob(
        old_sku,
        new_sku,
        simulation,
        plan,
        baseCtx(),
      );
      if (!result.success) return toolError(result.error);
      return jsonResult(result.job);
    },
  );

  server.registerTool(
    "approve_migration_job",
    {
      description: "Approve a pending migration job. Requires approver role.",
      annotations: { destructiveHint: true },
      inputSchema: { job_id: z.number().int() },
    },
    async ({ job_id }) => {
      const result = await migration.approveJob(job_id, baseCtx());
      if (!result.success) return toolError(result.error);
      return jsonResult(result.job);
    },
  );

  server.registerTool(
    "execute_migration_job",
    {
      description: "Execute an approved migration job idempotently.",
      annotations: { destructiveHint: true },
      inputSchema: { job_id: z.number().int() },
    },
    async ({ job_id }) => {
      const result = await migration.executeJob(job_id, baseCtx());
      if (!result.success) return toolError(result.error);
      return jsonResult({ job: result.job, apply: result.apply });
    },
  );

  server.registerTool(
    "get_migration_job_status",
    {
      description: "Get migration job status and steps.",
      annotations: { readOnlyHint: true },
      inputSchema: { job_id: z.number().int() },
    },
    async ({ job_id }) => {
      const job = await migration.getJob(job_id);
      if (!job) return toolError("Job not found");
      const steps = await migration.getJobSteps(job_id);
      return jsonResult({ job, steps });
    },
  );

  return server;
}

export function createRippleMcpApp() {
  const app = createMcpExpressApp({ host: "0.0.0.0" });
  const transports: Record<string, StreamableHTTPServerTransport> = {};
  const impact = new ImpactService();
  const migration = new MigrationService();

  app.use(correlationMiddleware);
  app.use(requestLogMiddleware);
  app.use(rateLimitMiddleware);
  app.use(oidcActorMiddleware);

  app.get("/health", async (_req: Request, res: Response) => {
    const adapter = await impact.healthCheck();
    res.json({
      status: adapter.ok ? "ok" : "degraded",
      service: "ripple-mcp",
      dataSource: impact.dataSourceName,
      adapter,
    });
  });

  app.get("/metrics", (_req: Request, res: Response) => {
    res.json(getMetricsSnapshot());
  });

  app.use("/mcp", authMiddleware);

  app.all("/mcp", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionId = req.headers["mcp-session-id"];
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId && transports[sessionId as string]) {
        transport = transports[sessionId as string];
      } else if (
        !sessionId &&
        req.method === "POST" &&
        isInitializeRequest(req.body)
      ) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports[id] = transport!;
          },
        });
        transport.onclose = () => {
          const sid = transport?.sessionId;
          if (sid && transports[sid]) delete transports[sid];
        };
        const mcpServer = createRippleMcpServer(impact, migration, req);
        await mcpServer.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "MCP request error",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  return app;
}
