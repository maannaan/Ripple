#!/usr/bin/env bash
# Integration test for applyProductSkuUpdate (Phase 5).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

POSTGRES_USER="${POSTGRES_USER:-ripple}"
POSTGRES_DB="${POSTGRES_DB:-ripple}"

psql_query() {
  docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "$1" | tr -d '[:space:]'
}

echo "Resetting database to Scenario A seed..."
npm run db:reset
bash scripts/migrate-db.sh

echo "Waiting for seed data..."
for i in $(seq 1 30); do
  COUNT="$(docker compose exec -T postgres psql -U ripple -d ripple -tAc \
    "SELECT COUNT(*) FROM products WHERE sku = 'ACME-1847';" 2>/dev/null | tr -d '[:space:]')"
  if [[ "$COUNT" == "1" ]]; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "FAIL: seed data not ready after reset"
    exit 1
  fi
  sleep 1
done

echo "Building MCP server..."
npm run build --workspace=mcp-server

echo "Test 1: reject wrong old_sku (no DB changes)..."
node --input-type=module <<'NODE'
import { applyProductSkuUpdate, closePool } from "./mcp-server/dist/db.js";

const before = await applyProductSkuUpdate("ACME-9999", "ACME-2847", "test");
if (before.success) {
  console.error("Expected failure for wrong old_sku");
  process.exit(1);
}
await closePool();
NODE

SKU_AFTER_REJECT="$(psql_query "SELECT sku FROM products WHERE product_id = 1;")"
if [[ "$SKU_AFTER_REJECT" != "ACME-1847" ]]; then
  echo "FAIL: SKU changed after rejected apply (got ${SKU_AFTER_REJECT})"
  exit 1
fi
echo "PASS: wrong old_sku rejected, SKU unchanged"

echo "Test 2: apply ACME-1847 → ACME-2847..."
node --input-type=module <<'NODE'
import { applyProductSkuUpdate, closePool } from "./mcp-server/dist/db.js";

const result = await applyProductSkuUpdate("ACME-1847", "ACME-2847", "test");
if (!result.success) {
  console.error("Apply failed:", result.error);
  process.exit(1);
}
if (result.shipment_ids_flagged.join(",") !== "5002") {
  console.error("Expected shipment 5002 flagged, got", result.shipment_ids_flagged);
  process.exit(1);
}
if (result.customer_orders_skipped.join(",") !== "9001,9002") {
  console.error("Expected orders 9001,9002 skipped, got", result.customer_orders_skipped);
  process.exit(1);
}
console.log("apply result audit_id=" + result.audit_id);
await closePool();
NODE

SKU="$(psql_query "SELECT sku FROM products WHERE product_id = 1;")"
if [[ "$SKU" != "ACME-2847" ]]; then
  echo "FAIL: expected SKU ACME-2847, got ${SKU}"
  exit 1
fi

FLAG="$(psql_query "SELECT needs_remapping FROM shipments WHERE shipment_id = 5002;")"
if [[ "$FLAG" != "t" ]]; then
  echo "FAIL: shipment 5002 needs_remapping expected true, got ${FLAG}"
  exit 1
fi

FLAG_DELIVERED="$(psql_query "SELECT needs_remapping FROM shipments WHERE shipment_id = 5001;")"
if [[ "$FLAG_DELIVERED" != "f" ]]; then
  echo "FAIL: delivered shipment 5001 should not be flagged, got ${FLAG_DELIVERED}"
  exit 1
fi

ORDER_COUNT="$(psql_query "SELECT COUNT(*) FROM customer_orders WHERE product_id = 1 AND order_id IN (9001, 9002);")"
if [[ "$ORDER_COUNT" != "2" ]]; then
  echo "FAIL: customer orders changed unexpectedly"
  exit 1
fi

AUDIT_COUNT="$(psql_query "SELECT COUNT(*) FROM audit_log WHERE old_sku = 'ACME-1847' AND new_sku = 'ACME-2847';")"
if [[ "$AUDIT_COUNT" != "1" ]]; then
  echo "FAIL: expected 1 audit_log row, got ${AUDIT_COUNT}"
  exit 1
fi

echo "PASS: apply_product_update integration test complete"
