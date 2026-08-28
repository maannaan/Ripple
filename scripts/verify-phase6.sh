#!/usr/bin/env bash
# Phase 6 verification gate (G6.1–G6.5 automated; G6.6–G6.7 manual).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0

pass() { echo "PASS G$1: $2"; }
fail() { echo "FAIL G$1: $2"; FAIL=1; }
info() { echo "INFO G$1: $2"; }

echo "=== Ripple Phase 6 verification ==="

# G6.1 CI (build + simulation)
if npm run ci >/dev/null 2>&1; then
  pass "6.1" "npm run ci"
else
  fail "6.1" "ci failed — run npm run ci"
fi

# G6.2 simulation tests (redundant check if ci includes them)
if python3 simulation/tests/run_tests.py >/dev/null 2>&1; then
  pass "6.2" "simulation tests"
else
  fail "6.2" "simulation tests failed"
fi

# G6.3 integration test (Docker)
if bash scripts/test-apply-update.sh; then
  pass "6.3" "test:apply integration"
else
  fail "6.3" "test:apply failed"
fi

# G6.4 required files
REQUIRED=(LICENSE docs/DEMO.md README.md)
for p in "$REQUIRED"; do
  if [[ ! -f "$p" ]]; then
    fail "6.4" "missing $p"
  fi
done
if [[ "$FAIL" -eq 0 ]] && grep -q "## Qodo Code Review Evidence" README.md; then
  pass "6.4" "LICENSE, docs/DEMO.md, Qodo section in README"
elif [[ "$FAIL" -eq 0 ]]; then
  fail "6.4" "README missing Qodo Code Review Evidence section"
fi

# G6.5 git remote
if git remote get-url origin >/dev/null 2>&1; then
  ORIGIN="$(git remote get-url origin)"
  if echo "$ORIGIN" | grep -qE 'github\.com'; then
    pass "6.5" "GitHub remote: $ORIGIN"
  else
    info "6.5" "origin set but not GitHub: $ORIGIN"
  fi
else
  info "6.5" "No git remote — push to public GitHub for submission"
fi

# G6.6 manual demo
info "6.6" "Manual: npm run demo:prep, live E2E chat, record ~3 min video (docs/DEMO.md)"

# G6.7 Qodo PR
if grep -qE 'github\.com/[^/]+/[^/]+/pull/[0-9]+' README.md 2>/dev/null; then
  pass "6.7" "README links to a GitHub pull request"
else
  info "6.7" "Update Qodo section with merged PR URL (not placeholder)"
fi

echo "=== Summary ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "Some automated checks failed."
  exit 1
fi
echo "Automated checks passed."
