#!/usr/bin/env bash
# Update existing Ripple agent (sandbox, skills, instructions, model).
set -euo pipefail

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
BASE="http://localhost:${TRUEFORGE_PORT}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"
MODEL="${RIPPLE_MODEL:-fireworks/minimax-m3}"
INSTRUCTIONS_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/agent/instructions.md"

if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}"
  exit 1
fi

if [[ ! -f "$INSTRUCTIONS_FILE" ]]; then
  echo "Missing $INSTRUCTIONS_FILE"
  exit 1
fi

AGENTS="$(curl -sf "${BASE}/api/v1/agents")"
AGENT_ID=$(echo "$AGENTS" | python3 -c "
import json,sys,os
name=os.environ.get('AGENT_NAME','ripple')
data=json.load(sys.stdin).get('data',[])
for a in data:
    if a.get('name')==name:
        print(a['id'])
        break
" AGENT_NAME="$AGENT_NAME")

if [[ -z "$AGENT_ID" ]]; then
  echo "Agent '${AGENT_NAME}' not found. Run: npm run agent:create"
  exit 1
fi

INSTRUCTIONS=$(python3 -c "import json; print(json.dumps(open('$INSTRUCTIONS_FILE').read()))")

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/skill-registered.sh
source "${SCRIPT_DIR}/lib/skill-registered.sh"

SKILLS_JSON="[]"
if skill_registered "${BASE}"; then
  SKILLS_JSON='[{"name": "ripple-simulation"}]'
else
  echo "WARN: skill ripple-simulation not registered — updating agent without skills array"
  echo "      Register after push: npm run skill:register"
fi

BODY=$(cat <<EOF
{
  "manifest": {
    "model": { "name": "${MODEL}" },
    "instructions": ${INSTRUCTIONS},
    "mcp_servers": [
      {
        "name": "ripple-data",
        "preload_tools": ["get_product"],
        "require_approval_for_tools": ["apply_product_update", "@write", "@destructive"]
      }
    ],
    "skills": ${SKILLS_JSON},
    "config": {
      "sandbox": { "enabled": true, "file_downloads": true }
    }
  }
}
EOF
)

HTTP_CODE=$(curl -s -o /tmp/ripple-agent-update.json -w "%{http_code}" \
  -X PUT "${BASE}/api/v1/agents/${AGENT_ID}" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "Updated agent '${AGENT_NAME}' (id ${AGENT_ID}) model=${MODEL} sandbox=enabled skill=ripple-simulation"
  exit 0
fi

echo "Failed to update agent (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-agent-update.json
exit 1
