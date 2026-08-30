#!/usr/bin/env bash
# Automated logic E2E: DB fetch → simulate_change → apply_product_update (no TrueForge UI).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== Ripple e2e pipeline (automated logic path) ==="

echo "Resetting database to Scenario A seed..."
npm run db:reset >/dev/null
bash scripts/migrate-db.sh

echo "Waiting for seed data..."
for i in $(seq 1 30); do
  COUNT="$(docker compose exec -T postgres psql -U ripple -d ripple -tAc \
    "SELECT COUNT(*) FROM products WHERE sku = 'ACME-1847';" 2>/dev/null | tr -d '[:space:]')"
  if [[ "$COUNT" == "1" ]]; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "FAIL: seed data not ready"
    exit 1
  fi
  sleep 1
done

echo "Building MCP server..."
npm run build --workspace=mcp-server >/dev/null

export DATABASE_URL="${DATABASE_URL:-postgres://ripple:ripple@localhost:5433/ripple}"
node scripts/e2e-pipeline.mjs

echo ""
echo "Manual TrueForge chat demo remains in docs/DEMO.md (UI + approval gate)."
