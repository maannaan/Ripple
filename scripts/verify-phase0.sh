#!/usr/bin/env bash
# Phase 0 verification gate (G0.1–G0.7)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
MCP_SERVER_PORT="${MCP_SERVER_PORT:-3100}"

pass() { echo "PASS G$1: $2"; }
fail() { echo "FAIL G$1: $2"; FAIL=1; }
info() { echo "INFO G$1: $2"; }

echo "=== Ripple Phase 0 verification ==="

# G0.1 Node version
if npm run check >/dev/null 2>&1; then
  pass "0.1" "Environment check (Node >= 22.14)"
else
  fail "0.1" "Environment check failed — run npm run check"
fi

# G0.2 TrueForge UI loads
if curl -sf "http://localhost:${TRUEFORGE_PORT}" >/dev/null 2>&1; then
  pass "0.2" "TrueForge reachable at http://localhost:${TRUEFORGE_PORT}"
else
  fail "0.2" "TrueForge not reachable — run npm run trueforge"
fi

# G0.3 Anthropic model configured
PROVIDERS="$(curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/settings/model-providers" 2>/dev/null || echo '{}')"
if echo "$PROVIDERS" | grep -q 'anthropic'; then
  pass "0.3" "Anthropic provider configured"
else
  info "0.3" "Anthropic not configured — Settings → Models → Anthropic → paste API key"
  info "0.3" "Or: export ANTHROPIC_API_KEY and run scripts/configure-anthropic.sh"
fi

# G0.4 Chat smoke test (manual unless provider configured)
if echo "$PROVIDERS" | grep -q 'anthropic'; then
  info "0.4" "Send in chat: Reply with exactly: RIPPLE_PHASE0_OK"
else
  info "0.4" "Skipped — configure Anthropic first (G0.3)"
fi

# G0.5 Repo scaffold
REQUIRED_PATHS=(
  README.md
  .env.example
  package.json
  scripts/start-trueforge.sh
  scripts/check-env.sh
  db/README.md
  mcp-server/package.json
  mcp-server/src/index.ts
  simulation/README.md
  agent/README.md
  .github/workflows/ci.yml
)
for p in "$REQUIRED_PATHS"; do
  if [[ ! -e "$p" ]]; then
    fail "0.5" "Missing $p"
  fi
done
if [[ "$FAIL" -eq 0 ]]; then
  pass "0.5" "Repo scaffold files present"
fi

# G0.6 MCP stub builds
if npm run ci >/dev/null 2>&1; then
  pass "0.6" "MCP server builds (npm run ci)"
else
  fail "0.6" "Build failed — run npm run ci"
fi

# G0.6b MCP health (optional runtime)
if curl -sf "http://localhost:${MCP_SERVER_PORT}/health" | grep -q 'ripple-mcp'; then
  pass "0.6" "MCP health endpoint OK"
else
  info "0.6" "MCP not running — npm run mcp:dev (optional for scaffold)"
fi

# G0.7 Git clean
if git rev-parse --git-dir >/dev/null 2>&1; then
  pass "0.7" "Git repository initialized"
else
  fail "0.7" "Git not initialized"
fi
if git check-ignore -q .env 2>/dev/null || [[ ! -f .env ]]; then
  pass "0.7" ".env not tracked (or absent)"
else
  fail "0.7" ".env exists and may be tracked — remove from git"
fi
if git remote get-url origin >/dev/null 2>&1; then
  pass "0.7" "Git remote 'origin' configured"
else
  info "0.7" "No git remote — git remote add origin <url>"
fi

echo "=== Summary ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "Some automated checks failed."
  exit 1
fi
echo "Automated checks passed. Complete manual steps for G0.3/G0.4 if not done."
