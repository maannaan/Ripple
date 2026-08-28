#!/usr/bin/env bash
# Phase 3 verification gate (G3.1–G3.2 automated; G3.3–G3.5 manual hints).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"

pass() { echo "PASS G$1: $2"; }
fail() { echo "FAIL G$1: $2"; FAIL=1; }
info() { echo "INFO G$1: $2"; }

echo "=== Ripple Phase 3 verification ==="

# G3.1 unit tests
if python3 simulation/tests/run_tests.py 2>/dev/null; then
  pass "3.1" "simulation unit tests"
else
  fail "3.1" "simulation tests failed — run: npm run simulation:test"
fi

# G3.2 local CLI
REV=$(python3 simulation/simulate_change.py --fixture scenario_a | python3 -c "import sys,json; print(json.load(sys.stdin).get('revenue_exposure',''))")
if [[ "$REV" == "21850.0" ]] || [[ "$REV" == "21850" ]]; then
  pass "3.2" "simulate_change scenario_a revenue_exposure=21850"
else
  fail "3.2" "expected revenue_exposure 21850, got ${REV}"
fi

# G3.3 agent sandbox
if curl -sf "http://localhost:${TRUEFORGE_PORT}" >/dev/null 2>&1; then
  if curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/agents" | grep -q '"enabled": true' && \
     curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/agents" | grep -q 'fireworks/minimax-m3'; then
    pass "3.3" "Agent ${AGENT_NAME} updated (sandbox enabled, Fireworks model)"
  else
    info "3.3" "Run: npm run agent:update"
  fi
else
  info "3.3" "TrueForge not running — npm run trueforge && npm run agent:update"
fi

# G3.4 skill
if curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/settings/skills" 2>/dev/null | grep -q 'ripple-simulation'; then
  pass "3.4" "Skill ripple-simulation registered"
else
  info "3.4" "Register skill: npm run skill:register (needs RIPPLE_SKILL_GIT_URL) or Settings → Skills"
fi

# G3.5 manual
info "3.5" "Chat test: Agents → ${AGENT_NAME} → 'Impact of ACME-1847 → ACME-2847' (expect revenue 21850, PO 101/102)"

echo "=== Summary ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "Some automated checks failed."
  exit 1
fi
echo "Automated checks passed."
