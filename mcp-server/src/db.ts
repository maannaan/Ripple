import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ??
      "postgres://ripple:ripple@localhost:5433/ripple";
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type Product = {
  product_id: number;
  sku: string;
  name: string;
  supplier: string;
  status: string;
};

export async function getProductBySku(sku: string): Promise<Product | null> {
  const result = await getPool().query<Product>(
    "SELECT product_id, sku, name, supplier, status FROM products WHERE sku = $1",
    [sku],
  );
  return result.rows[0] ?? null;
}

export async function getProductById(productId: number): Promise<Product | null> {
  const result = await getPool().query<Product>(
    "SELECT product_id, sku, name, supplier, status FROM products WHERE product_id = $1",
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function findPurchaseOrders(productId: number) {
  const result = await getPool().query(
    "SELECT po_id, supplier, product_id, quantity, status FROM purchase_orders WHERE product_id = $1 ORDER BY po_id",
    [productId],
  );
  return result.rows;
}

export async function findShipments(productId: number) {
  const result = await getPool().query(
    "SELECT shipment_id, po_id, product_id, quantity, status FROM shipments WHERE product_id = $1 ORDER BY shipment_id",
    [productId],
  );
  return result.rows;
}

export async function findCustomerOrders(productId: number) {
  const result = await getPool().query(
    "SELECT order_id, product_id, quantity, status, region FROM customer_orders WHERE product_id = $1 ORDER BY order_id",
    [productId],
  );
  return result.rows;
}

export async function findPricingRules(productId: number) {
  const result = await getPool().query(
    "SELECT rule_id, product_id, price, region FROM pricing_rules WHERE product_id = $1 ORDER BY rule_id",
    [productId],
  );
  return result.rows;
}

export type ApplyProductUpdateSuccess = {
  success: true;
  audit_id: number;
  old_sku: string;
  new_sku: string;
  product_id: number;
  shipment_ids_flagged: number[];
  customer_orders_skipped: number[];
};

export type ApplyProductUpdateFailure = {
  success: false;
  error: string;
};

export type ApplyProductUpdateResult =
  | ApplyProductUpdateSuccess
  | ApplyProductUpdateFailure;

export type AuditLogEntry = {
  audit_id: number;
  action: string;
  old_sku: string;
  new_sku: string;
  product_id: number | null;
  actor: string | null;
  changes_json: Record<string, unknown>;
  created_at: string;
};

export async function applyProductSkuUpdate(
  oldSku: string,
  newSku: string,
  actor?: string,
): Promise<ApplyProductUpdateResult> {
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
        actor ?? null,
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

export async function getAuditLog(options: {
  audit_id?: number;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  if (options.audit_id !== undefined) {
    const result = await getPool().query<AuditLogEntry>(
      "SELECT audit_id, action, old_sku, new_sku, product_id, actor, changes_json, created_at FROM audit_log WHERE audit_id = $1",
      [options.audit_id],
    );
    return result.rows;
  }

  const limit = options.limit ?? 10;
  const result = await getPool().query<AuditLogEntry>(
    "SELECT audit_id, action, old_sku, new_sku, product_id, actor, changes_json, created_at FROM audit_log ORDER BY audit_id DESC LIMIT $1",
    [limit],
  );
  return result.rows;
}
