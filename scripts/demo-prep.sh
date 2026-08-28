#!/usr/bin/env bash
# Reset Scenario A seed and print demo next steps (Phase 6).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
MCP_PORT="${MCP_PORT:-3100}"

echo "=== Ripple demo prep ==="
echo "Resetting database to Scenario A (ACME-1847)..."
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
    echo "FAIL: seed data not ready"
    exit 1
  fi
  sleep 1
done

echo "PASS: Database ready with ACME-1847"
echo ""
echo "Next steps:"
echo "  1. npm run trueforge     → http://localhost:${TRUEFORGE_PORT}"
echo "  2. npm run mcp:dev         → http://localhost:${MCP_PORT}/health"
echo "  3. npm run mcp:register && npm run agent:update"
echo "  4. Agents → ripple → see docs/DEMO.md"
echo ""

if curl -sf "http://localhost:${MCP_PORT}/health" | grep -q ripple-mcp; then
  echo "MCP health: OK"
else
  echo "MCP health: not running (start npm run mcp:dev)"
fi

if curl -sf "http://localhost:${TRUEFORGE_PORT}" >/dev/null 2>&1; then
  echo "TrueForge: OK"
else
  echo "TrueForge: not running (start npm run trueforge)"
fi
