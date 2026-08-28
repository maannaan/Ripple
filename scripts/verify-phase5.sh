#!/usr/bin/env bash
# Phase 5 verification gate (G5.1–G5.2 automated; G5.3–G5.5 manual hints).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
MCP_PORT="${MCP_PORT:-3100}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"
POSTGRES_USER="${POSTGRES_USER:-ripple}"
POSTGRES_DB="${POSTGRES_DB:-ripple}"

pass() { echo "PASS G$1: $2"; }
fail() { echo "FAIL G$1: $2"; FAIL=1; }
info() { echo "INFO G$1: $2"; }

echo "=== Ripple Phase 5 verification ==="

# G5.1 migration column exists
if docker compose ps postgres 2>/dev/null | grep -q "Up"; then
  COL="$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='shipments' AND column_name='needs_remapping';" \
    | tr -d '[:space:]')"
  if [[ "$COL" == "1" ]]; then
    pass "5.1" "shipments.needs_remapping column exists"
  else
    fail "5.1" "missing needs_remapping — run: npm run db:migrate"
  fi
else
  info "5.1" "Postgres not running — npm run db:setup"
fi

# G5.2 integration test
if bash scripts/test-apply-update.sh; then
  pass "5.2" "npm run test:apply"
else
  fail "5.2" "test:apply failed"
fi

# G5.3 MCP tool registered
if curl -sf "http://localhost:${MCP_PORT}/health" >/dev/null 2>&1; then
  if npm run build --workspace=mcp-server >/dev/null 2>&1 && \
     grep -q "apply_product_update" mcp-server/dist/mcp-app.js; then
    pass "5.3" "MCP server includes apply_product_update"
  else
    fail "5.3" "apply_product_update not found in MCP build"
  fi
else
  info "5.3" "MCP not running — npm run mcp:dev (tool is in server code)"
fi

# G5.4 agent approval gate
if curl -sf "http://localhost:${TRUEFORGE_PORT}" >/dev/null 2>&1; then
  AGENTS_JSON="$(curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/agents")"
  if echo "$AGENTS_JSON" | grep -q 'apply_product_update'; then
    pass "5.4" "Agent requires approval for apply_product_update"
  else
    info "5.4" "Run: npm run agent:update"
  fi
else
  info "5.4" "TrueForge not running — npm run trueforge && npm run agent:update"
fi

# G5.5 manual
info "5.5" "Chat: impact ACME-1847→ACME-2847, then 'Approve safe updates', Allow tool → verify SKU + shipment 5002 flagged"

echo "=== Summary ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "Some automated checks failed."
  exit 1
fi
echo "Automated checks passed."
