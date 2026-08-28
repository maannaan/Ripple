// @ts-nocheck
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  applyProductSkuUpdate,
  findCustomerOrders,
  findPricingRules,
  findPurchaseOrders,
  findShipments,
  getAuditLog,
  getProductById,
  getProductBySku,
} from "./db.js";

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

function createRippleMcpServer(): McpServer {
  const server = new McpServer({
    name: "ripple-mcp",
    version: "0.1.0",
  });

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
      const product = sku
        ? await getProductBySku(sku)
        : await getProductById(product_id!);
      if (!product) {
        return toolError("Product not found.");
      }
      return jsonResult(product);
    },
  );

  server.registerTool(
    "find_purchase_orders",
    {
      description: "List purchase orders referencing a product_id.",
      inputSchema: {
        product_id: z.number().int().describe("Product id from products table"),
      },
    },
    async ({ product_id }) => jsonResult(await findPurchaseOrders(product_id)),
  );

  server.registerTool(
    "find_shipments",
    {
      description: "List shipments referencing a product_id.",
      inputSchema: {
        product_id: z.number().int().describe("Product id from products table"),
      },
    },
    async ({ product_id }) => jsonResult(await findShipments(product_id)),
  );

  server.registerTool(
    "find_customer_orders",
    {
      description: "List customer orders referencing a product_id.",
      inputSchema: {
        product_id: z.number().int().describe("Product id from products table"),
      },
    },
    async ({ product_id }) => jsonResult(await findCustomerOrders(product_id)),
  );

  server.registerTool(
    "find_pricing_rules",
    {
      description: "List pricing rules for a product_id.",
      inputSchema: {
        product_id: z.number().int().describe("Product id from products table"),
      },
    },
    async ({ product_id }) => jsonResult(await findPricingRules(product_id)),
  );

  server.registerTool(
    "apply_product_update",
    {
      description:
        "Apply safe SKU migration: update products.sku and flag in-transit shipments for remapping. Requires explicit user approval.",
      annotations: {
        destructiveHint: true,
        readOnlyHint: false,
      },
      inputSchema: {
        old_sku: z.string().describe("Current SKU in the database"),
        new_sku: z.string().describe("Target SKU after migration"),
        actor: z.string().optional().describe("Optional actor label for audit log"),
      },
    },
    async ({ old_sku, new_sku, actor }) => {
      const result = await applyProductSkuUpdate(old_sku, new_sku, actor);
      if (!result.success) {
        return toolError(result.error);
      }
      return jsonResult(result);
    },
  );

  server.registerTool(
    "get_audit_log",
    {
      description: "Fetch audit log entries by audit_id or recent limit.",
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        audit_id: z.number().int().optional().describe("Specific audit entry"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Recent entries when audit_id omitted (default 10)"),
      },
    },
    async ({ audit_id, limit }) => {
      if (audit_id === undefined && limit === undefined) {
        return jsonResult(await getAuditLog({ limit: 10 }));
      }
      if (audit_id !== undefined) {
        return jsonResult(await getAuditLog({ audit_id }));
      }
      return jsonResult(await getAuditLog({ limit }));
    },
  );

  return server;
}

export function createRippleMcpApp() {
  const app = createMcpExpressApp({ host: "0.0.0.0" });
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "ripple-mcp" });
  });

  app.all("/mcp", async (req: Request, res: Response) => {
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
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };
        const mcpServer = createRippleMcpServer();
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
      console.error("MCP request error:", error);
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
