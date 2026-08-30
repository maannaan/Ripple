#!/usr/bin/env node
/**
 * Automated logic pipeline: MCP-equivalent DB reads → simulate_change → apply_product_update.
 * Does not use TrueForge chat/UI.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyProductSkuUpdate,
  closePool,
  findCustomerOrders,
  findPricingRules,
  findPurchaseOrders,
  findShipments,
  getProductBySku,
  getPool,
} from "../mcp-server/dist/db.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OLD_SKU = "ACME-1847";
const NEW_SKU = "ACME-2847";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function runSimulation(input) {
  const tmp = join(tmpdir(), `ripple-e2e-${process.pid}.json`);
  writeFileSync(tmp, JSON.stringify(input));
  try {
    const out = execFileSync(
      "python3",
      [join(ROOT, "simulation/simulate_change.py"), "--input", tmp],
      { encoding: "utf-8" },
    );
    return JSON.parse(out);
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

async function main() {
  const product = await getProductBySku(OLD_SKU);
  if (!product) {
    fail(`product not found: ${OLD_SKU}`);
  }

  const productId = product.product_id;
  const purchase_orders = await findPurchaseOrders(productId);
  const shipments = await findShipments(productId);
  const customer_orders = await findCustomerOrders(productId);
  const pricing_rules = await findPricingRules(productId);

  const input = {
    old_sku: OLD_SKU,
    new_sku: NEW_SKU,
    product,
    purchase_orders,
    shipments,
    customer_orders,
    pricing_rules: pricing_rules.map((row) => ({
      ...row,
      price: Number(row.price),
    })),
  };

  const sim = runSimulation(input);

  if (sim.revenue_exposure !== 21850) {
    fail(`simulation revenue expected 21850, got ${sim.revenue_exposure}`);
  }
  if (sim.details.purchase_order_ids.join(",") !== "101,102") {
    fail(`expected POs 101,102, got ${sim.details.purchase_order_ids}`);
  }
  if (sim.details.in_transit_shipment_ids.join(",") !== "5002") {
    fail(`expected in-transit 5002, got ${sim.details.in_transit_shipment_ids}`);
  }
  pass("simulation revenue_exposure=21850, POs 101/102, shipment 5002 in transit");

  const reject = await applyProductSkuUpdate("ACME-9999", NEW_SKU, "e2e-pipeline");
  if (reject.success) {
    fail("expected rejection for wrong old_sku");
  }
  pass("wrong old_sku rejected");

  const afterReject = await getProductBySku(OLD_SKU);
  if (!afterReject) {
    fail("product missing after rejected apply");
  }

  const apply = await applyProductSkuUpdate(OLD_SKU, NEW_SKU, "e2e-pipeline");
  if (!apply.success) {
    fail(`apply failed: ${apply.error}`);
  }
  if (!apply.shipment_ids_flagged.includes(5002)) {
    fail(`expected shipment 5002 flagged, got ${apply.shipment_ids_flagged}`);
  }
  pass(`apply_product_update audit_id=${apply.audit_id}`);

  const updated = await getProductBySku(NEW_SKU);
  if (!updated) {
    fail(`product not found after apply: ${NEW_SKU}`);
  }
  pass(`product SKU updated to ${NEW_SKU}`);

  const pool = getPool();
  const flagResult = await pool.query(
    "SELECT needs_remapping FROM shipments WHERE shipment_id = 5002",
  );
  if (flagResult.rows[0]?.needs_remapping !== true) {
    fail("shipment 5002 needs_remapping expected true");
  }
  pass("shipment 5002 flagged needs_remapping");

  await closePool();
  console.log("OK: e2e pipeline passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
