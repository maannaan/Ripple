#!/usr/bin/env bash
# CI integration test: applyProductSkuUpdate against Postgres (no Docker Compose).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgres://ripple:ripple@localhost:5433/ripple}"

npm run build --workspace=mcp-server

node --input-type=module <<'NODE'
import { applyProductSkuUpdate, closePool } from "./mcp-server/dist/db.js";

const reject = await applyProductSkuUpdate("ACME-9999", "ACME-2847", "ci");
if (reject.success) {
  console.error("Expected rejection for wrong SKU");
  process.exit(1);
}

const result = await applyProductSkuUpdate("ACME-1847", "ACME-2847", "ci");
if (!result.success) {
  console.error("Apply failed:", result.error);
  process.exit(1);
}
if (!result.shipment_ids_flagged.includes(5002)) {
  console.error("Expected shipment 5002 flagged");
  process.exit(1);
}

await closePool();
console.log("OK: CI integration apply test");
NODE
