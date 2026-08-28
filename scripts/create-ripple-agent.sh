#!/usr/bin/env bash
# Create Ripple agent in TrueForge (default: Fireworks + sandbox + simulation skill).
set -euo pipefail

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
BASE="http://localhost:${TRUEFORGE_PORT}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"
MODEL="${RIPPLE_MODEL:-fireworks/minimax-m3}"
INSTRUCTIONS_FILE="$(cd "$(dirname "$0")/.." && pwd)/agent/instructions.md"

if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}"
  exit 1
fi

if [[ ! -f "$INSTRUCTIONS_FILE" ]]; then
  echo "Missing $INSTRUCTIONS_FILE"
  exit 1
fi

INSTRUCTIONS=$(python3 -c "import json; print(json.dumps(open('$INSTRUCTIONS_FILE').read()))")

SKILLS_JSON="[]"
if curl -sf "${BASE}/api/v1/settings/skills" | grep -q '"name": "ripple-simulation"'; then
  SKILLS_JSON='[{"name": "ripple-simulation"}]'
fi

EXISTING="$(curl -sf "${BASE}/api/v1/agents" || echo '{}')"
if echo "$EXISTING" | grep -q "\"name\": \"${AGENT_NAME}\""; then
  echo "Agent '${AGENT_NAME}' already exists. Run: npm run agent:update"
  exit 0
fi

BODY=$(cat <<EOF
{
  "name": "${AGENT_NAME}",
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

HTTP_CODE=$(curl -s -o /tmp/ripple-agent-create.json -w "%{http_code}" \
  -X POST "${BASE}/api/v1/agents" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Created agent '${AGENT_NAME}' with model ${MODEL}, sandbox enabled"
  echo "Open ${BASE} -> Agents -> ${AGENT_NAME}"
  echo "Register skill first if needed: npm run skill:register"
  exit 0
fi

echo "Failed to create agent (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-agent-create.json
exit 1
