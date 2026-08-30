#!/usr/bin/env bash
# Automated pre-flight for demo rehearsal (MCP + simulation + apply path).
# Complements manual chat runs in docs/DEMO.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAIL=1; }

echo "=== Ripple rehearsal verify (automated) ==="

# 1. Simulation golden numbers
REV=$(python3 simulation/simulate_change.py --fixture scenario_a | python3 -c "import sys,json; print(json.load(sys.stdin).get('revenue_exposure',''))")
if [[ "$REV" == "21850.0" ]] || [[ "$REV" == "21850" ]]; then
  pass "simulation revenue_exposure=21850"
else
  fail "simulation expected 21850, got ${REV}"
fi

# 2. MCP health (warn if services not started yet)
if curl -sf http://localhost:3100/health | grep -q ripple-mcp; then
  pass "MCP server healthy"
else
  echo "WARN: MCP not running — start npm run mcp:dev before full rehearsal"
fi

# 3. DB seed
SKU=$(docker compose exec -T postgres psql -U ripple -d ripple -tAc \
  "SELECT sku FROM products WHERE product_id=1;" 2>/dev/null | tr -d '[:space:]')
if [[ "$SKU" == "ACME-1847" ]]; then
  pass "Scenario A seed (ACME-1847)"
else
  fail "expected ACME-1847, got '${SKU}' — run npm run demo:prep"
fi

# 4. TrueForge (manual chat layer)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/skill-registered.sh
source "${SCRIPT_DIR}/lib/skill-registered.sh"

if curl -sf http://localhost:8790 >/dev/null 2>&1; then
  pass "TrueForge reachable"
  if skill_registered "http://localhost:8790"; then
    pass "skill ripple-simulation registered"
  else
    echo "WARN: skill not registered — export RIPPLE_SKILL_GIT_URL=https://github.com/maannaan/Ripple && npm run skill:register"
  fi
else
  echo "INFO: TrueForge not running — npm run trueforge (required for live chat rehearsal)"
fi

echo ""
echo "Manual chat rehearsal (run twice before video):"
echo "  1. Impact of ACME-1847 → ACME-2847"
echo "  2. Approve safe updates → Allow apply_product_update"
echo "  See docs/DEMO.md"

if [[ "$FAIL" -ne 0 ]]; then
  exit 1
fi
echo "Automated rehearsal checks passed."
