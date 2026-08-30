#!/usr/bin/env bash
# Create Ripple agent in TrueForge (Fireworks + sandbox + subagents + simulation skill).
set -euo pipefail

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
BASE="http://localhost:${TRUEFORGE_PORT}"
AGENT_NAME="${RIPPLE_AGENT_NAME:-ripple}"
MODEL="${RIPPLE_MODEL:-fireworks/minimax-m3}"
INSTRUCTIONS_FILE="$(cd "$(dirname "$0")/.." && pwd)/agent/instructions.md"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/agent-manifest.sh
source "${SCRIPT_DIR}/lib/agent-manifest.sh"

if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}"
  exit 1
fi

if [[ ! -f "$INSTRUCTIONS_FILE" ]]; then
  echo "Missing $INSTRUCTIONS_FILE"
  exit 1
fi

SKILLS_JSON="$(ripple_skills_json "${BASE}")"

EXISTING="$(curl -sf "${BASE}/api/v1/agents" || echo '{}')"
if echo "$EXISTING" | grep -q "\"name\": \"${AGENT_NAME}\""; then
  echo "Agent '${AGENT_NAME}' already exists. Run: npm run agent:update"
  exit 0
fi

MANIFEST="$(ripple_build_manifest "$INSTRUCTIONS_FILE" "$MODEL" "$SKILLS_JSON")"
BODY=$(python3 -c "import json,sys; print(json.dumps({'name': sys.argv[1], 'manifest': json.loads(sys.argv[2])}))" \
  "$AGENT_NAME" "$MANIFEST")

HTTP_CODE=$(curl -s -o /tmp/ripple-agent-create.json -w "%{http_code}" \
  -X POST "${BASE}/api/v1/agents" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Created agent '${AGENT_NAME}' with model ${MODEL}, sandbox + dynamic subagents enabled"
  echo "Open ${BASE} -> Agents -> ${AGENT_NAME}"
  echo "Register skill first if needed: npm run skill:register"
  exit 0
fi

echo "Failed to create agent (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-agent-create.json
exit 1
