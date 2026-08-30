import type {
  ApplyPlan,
  ApplyResult,
  AuditLogEntry,
  CustomerOrder,
  PricingRule,
  Product,
  PurchaseOrder,
  RequestContext,
  Shipment,
} from "../domain/types.js";
import { getPool } from "../db/pool.js";
import type { RippleDataSource } from "./types.js";

export class PostgresRippleDataSource implements RippleDataSource {
  readonly name = "postgres";

  async healthCheck(): Promise<{ ok: boolean; detail?: string }> {
    try {
      await getPool().query("SELECT 1");
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getProduct(query: {
    sku?: string;
    productId?: number;
  }): Promise<Product | null> {
    if (query.sku) {
      const result = await getPool().query<Product>(
        "SELECT product_id, sku, name, supplier, status FROM products WHERE sku = $1",
        [query.sku],
      );
      return result.rows[0] ?? null;
    }
    if (query.productId !== undefined) {
      const result = await getPool().query<Product>(
        "SELECT product_id, sku, name, supplier, status FROM products WHERE product_id = $1",
        [query.productId],
      );
      return result.rows[0] ?? null;
    }
    return null;
  }

  async findPurchaseOrders(productId: number): Promise<PurchaseOrder[]> {
    const result = await getPool().query<PurchaseOrder>(
      "SELECT po_id, supplier, product_id, quantity, status FROM purchase_orders WHERE product_id = $1 ORDER BY po_id",
      [productId],
    );
    return result.rows;
  }

  async findShipments(productId: number): Promise<Shipment[]> {
    const result = await getPool().query<Shipment>(
      "SELECT shipment_id, po_id, product_id, quantity, status FROM shipments WHERE product_id = $1 ORDER BY shipment_id",
      [productId],
    );
    return result.rows;
  }

  async findCustomerOrders(productId: number): Promise<CustomerOrder[]> {
    const result = await getPool().query<CustomerOrder>(
      "SELECT order_id, product_id, quantity, status, region FROM customer_orders WHERE product_id = $1 ORDER BY order_id",
      [productId],
    );
    return result.rows;
  }

  async findPricingRules(productId: number): Promise<PricingRule[]> {
    const result = await getPool().query<PricingRule & { price: string }>(
      "SELECT rule_id, product_id, price, region FROM pricing_rules WHERE product_id = $1 ORDER BY rule_id",
      [productId],
    );
    return result.rows.map((row) => ({
      ...row,
      price: Number(row.price),
    }));
  }

  async applySkuMigration(
    plan: ApplyPlan,
    ctx: RequestContext,
  ): Promise<ApplyResult> {
    if (ctx.readOnly) {
      return { success: false, error: "Data source is in read-only mode" };
    }

    const { old_sku: oldSku, new_sku: newSku } = plan;
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");

      const productResult = await client.query<Product>(
        "SELECT product_id, sku, name, supplier, status FROM products WHERE sku = $1 FOR UPDATE",
        [oldSku],
      );
      const product = productResult.rows[0];
      if (!product) {
        await client.query("ROLLBACK");
        return { success: false, error: `Product not found for SKU ${oldSku}` };
      }
      if (oldSku === newSku) {
        await client.query("ROLLBACK");
        return { success: false, error: "old_sku and new_sku are the same" };
      }

      const conflict = await client.query(
        "SELECT product_id FROM products WHERE sku = $1",
        [newSku],
      );
      if (conflict.rows.length > 0) {
        await client.query("ROLLBACK");
        return { success: false, error: `SKU ${newSku} already exists` };
      }

      const productId = product.product_id;

      await client.query("UPDATE products SET sku = $1 WHERE product_id = $2", [
        newSku,
        productId,
      ]);

      const flagged = await client.query<{ shipment_id: number }>(
        "UPDATE shipments SET needs_remapping = true WHERE product_id = $1 AND status = 'transit' RETURNING shipment_id",
        [productId],
      );
      const shipmentIdsFlagged = flagged.rows.map((row) => row.shipment_id);

      const orders = await client.query<{ order_id: number }>(
        "SELECT order_id FROM customer_orders WHERE product_id = $1 ORDER BY order_id",
        [productId],
      );
      const customerOrdersSkipped = orders.rows.map((row) => row.order_id);

      const pricing = await client.query<{ rule_id: number }>(
        "SELECT rule_id FROM pricing_rules WHERE product_id = $1 ORDER BY rule_id",
        [productId],
      );
      const pricingRuleIds = pricing.rows.map((row) => row.rule_id);

      const changesJson = {
        product_sku_updated: true,
        shipment_ids_flagged: shipmentIdsFlagged,
        pricing_rule_ids: pricingRuleIds,
        customer_orders_skipped: customerOrdersSkipped,
        plan: plan,
      };

      const auditResult = await client.query<{ audit_id: number }>(
        `INSERT INTO audit_log (action, old_sku, new_sku, product_id, actor, changes_json)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING audit_id`,
        [
          "apply_product_update",
          oldSku,
          newSku,
          productId,
          ctx.actor ?? null,
          JSON.stringify(changesJson),
        ],
      );

      await client.query("COMMIT");

      return {
        success: true,
        audit_id: auditResult.rows[0].audit_id,
        old_sku: oldSku,
        new_sku: newSku,
        product_id: productId,
        shipment_ids_flagged: shipmentIdsFlagged,
        customer_orders_skipped: customerOrdersSkipped,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      client.release();
    }
  }

  async getAuditLog(options: {
    audit_id?: number;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    if (options.audit_id !== undefined) {
      const result = await getPool().query<AuditLogEntry>(
        "SELECT audit_id, action, old_sku, new_sku, product_id, actor, job_id, changes_json, created_at FROM audit_log WHERE audit_id = $1",
        [options.audit_id],
      );
      return result.rows;
    }

    const limit = options.limit ?? 10;
    const result = await getPool().query<AuditLogEntry>(
      "SELECT audit_id, action, old_sku, new_sku, product_id, actor, job_id, changes_json, created_at FROM audit_log ORDER BY audit_id DESC LIMIT $1",
      [limit],
    );
    return result.rows;
  }
}

// Singleton for default usage
let defaultAdapter: PostgresRippleDataSource | null = null;

export function getPostgresAdapter(): PostgresRippleDataSource {
  if (!defaultAdapter) {
    defaultAdapter = new PostgresRippleDataSource();
  }
  return defaultAdapter;
}

// Legacy function exports for backward compatibility
export async function getProductBySku(sku: string): Promise<Product | null> {
  return getPostgresAdapter().getProduct({ sku });
}

export async function getProductById(productId: number): Promise<Product | null> {
  return getPostgresAdapter().getProduct({ productId });
}

export async function findPurchaseOrders(productId: number) {
  return getPostgresAdapter().findPurchaseOrders(productId);
}

export async function findShipments(productId: number) {
  return getPostgresAdapter().findShipments(productId);
}

export async function findCustomerOrders(productId: number) {
  return getPostgresAdapter().findCustomerOrders(productId);
}

export async function findPricingRules(productId: number) {
  return getPostgresAdapter().findPricingRules(productId);
}

export async function applyProductSkuUpdate(
  oldSku: string,
  newSku: string,
  actor?: string,
): Promise<ApplyResult> {
  const product = await getProductBySku(oldSku);
  if (!product) {
    return { success: false, error: `Product not found for SKU ${oldSku}` };
  }
  const plan: ApplyPlan = {
    old_sku: oldSku,
    new_sku: newSku,
    product_id: product.product_id,
    auto_steps: [],
    manual_review: [],
  };
  return getPostgresAdapter().applySkuMigration(plan, { actor });
}

export async function getAuditLog(options: {
  audit_id?: number;
  limit?: number;
}) {
  return getPostgresAdapter().getAuditLog(options);
}

export type { Product, ApplyResult };
