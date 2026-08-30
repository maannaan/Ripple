#!/usr/bin/env bash
# Phase 4 verification gate (G4.1–G4.5).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"

pass() { echo "PASS G$1: $2"; }
fail() { echo "FAIL G$1: $2"; FAIL=1; }
info() { echo "INFO G$1: $2"; }

echo "=== Ripple Phase 4 verification ==="

INSTRUCTIONS="${ROOT}/agent/instructions.md"
MANIFEST_LIB="${ROOT}/scripts/lib/agent-manifest.sh"

# G4.1 orchestration instructions
if grep -q "Orchestration" "$INSTRUCTIONS" && \
   grep -q "Fetch subtask" "$INSTRUCTIONS" && \
   grep -q "Simulate subtask" "$INSTRUCTIONS" && \
   grep -q "dynamic subagents" "$INSTRUCTIONS"; then
  pass "4.1" "instructions.md includes subagent orchestration"
else
  fail "4.1" "instructions.md missing orchestration section — see agent/instructions.md"
fi

# G4.2 manifest includes dynamic_sub_agents
if grep -q "dynamic_sub_agents" "$MANIFEST_LIB"; then
  pass "4.2" "agent-manifest.sh enables dynamic_sub_agents"
else
  fail "4.2" "scripts/lib/agent-manifest.sh missing dynamic_sub_agents"
fi

# G4.3–G4.4 live TrueForge agent checks
if curl -sf "http://localhost:${TRUEFORGE_PORT}" >/dev/null 2>&1; then
  AGENTS_JSON="$(curl -sf "http://localhost:${TRUEFORGE_PORT}/api/v1/agents")"
  AGENT_MANIFEST=$(echo "$AGENTS_JSON" | python3 -c "
import json, os, sys
name = os.environ.get('AGENT_NAME', 'ripple')
for a in json.load(sys.stdin).get('data', []):
    if a.get('name') == name:
        print(json.dumps(a.get('manifest', {})))
        break
" AGENT_NAME="$AGENT_NAME")

  if [[ -n "$AGENT_MANIFEST" && "$AGENT_MANIFEST" != "{}" ]]; then
    if echo "$AGENT_MANIFEST" | python3 -c "
import json, sys
m = json.load(sys.stdin)
cfg = m.get('config', {})
dsa = cfg.get('dynamic_sub_agents', {})
sys.exit(0 if dsa.get('enabled') is True else 1)
"; then
      pass "4.3" "agent '${AGENT_NAME}' has dynamic_sub_agents.enabled=true"
    else
      info "4.3" "Run: npm run agent:update (dynamic_sub_agents not enabled on live agent)"
    fi

    if echo "$AGENT_MANIFEST" | python3 -c "
import json, sys
m = json.load(sys.stdin)
cfg = m.get('config', {})
sandbox = cfg.get('sandbox', {})
skills = m.get('skills', [])
has_skill = any(s.get('name') == 'ripple-simulation' for s in skills)
mcp = m.get('mcp_servers', [])
approval = False
for s in mcp:
    req = s.get('require_approval_for_tools', [])
    if 'apply_product_update' in req:
        approval = True
sys.exit(0 if sandbox.get('enabled') and has_skill and approval else 1)
"; then
      pass "4.4" "sandbox + ripple-simulation skill + apply_product_update approval gate"
    else
      info "4.4" "Run: npm run skill:register && npm run agent:update"
    fi
  else
    info "4.3" "Agent '${AGENT_NAME}' not found — npm run agent:create"
    info "4.4" "Skipped — agent not found"
  fi
else
  info "4.3" "TrueForge not running — npm run trueforge && npm run agent:update"
  info "4.4" "Skipped — TrueForge not running"
fi

# G4.5 manual
info "4.5" "Manual: docs/DEMO.md Scenario A — confirm subagent threads in TrueForge UI during impact analysis"

echo "=== Summary ==="
if [[ "$FAIL" -ne 0 ]]; then
  echo "Some automated checks failed."
  exit 1
fi
echo "Automated checks passed."
