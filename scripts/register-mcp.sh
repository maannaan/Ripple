#!/usr/bin/env bash
# Register Ripple MCP server in local TrueForge (no auth).
set -euo pipefail

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
MCP_SERVER_PORT="${MCP_SERVER_PORT:-3100}"
BASE="http://localhost:${TRUEFORGE_PORT}"
MCP_URL="http://localhost:${MCP_SERVER_PORT}/mcp"
NAME="ripple-data"

if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}. Start: npm run trueforge"
  exit 1
fi

if ! curl -sf "http://localhost:${MCP_SERVER_PORT}/health" >/dev/null 2>&1; then
  echo "Ripple MCP not running at port ${MCP_SERVER_PORT}. Start: npm run mcp:dev"
  exit 1
fi

EXISTING="$(curl -sf "${BASE}/api/v1/settings/mcp-servers" || echo '{}')"
if echo "$EXISTING" | grep -q "\"name\": \"${NAME}\""; then
  echo "MCP server '${NAME}' already registered."
  exit 0
fi

BODY=$(cat <<EOF
{
  "manifest": {
    "type": "remote",
    "name": "${NAME}",
    "url": "${MCP_URL}",
    "description": "Ripple operational database tools (products, orders, shipments, pricing)"
  }
}
EOF
)

HTTP_CODE=$(curl -s -o /tmp/ripple-mcp-register.json -w "%{http_code}" \
  -X POST "${BASE}/api/v1/settings/mcp-servers" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Registered MCP server '${NAME}' -> ${MCP_URL}"
  TOOLS_CODE=$(curl -s -o /tmp/ripple-mcp-tools.json -w "%{http_code}" "${BASE}/api/v1/mcp-servers/${NAME}/tools")
  if [[ "$TOOLS_CODE" == "200" ]]; then
    python3 -c "
import json
d=json.load(open('/tmp/ripple-mcp-tools.json'))
tools=[t.get('name','') for t in d.get('data',[])]
print('Tools:', ', '.join(tools) if tools else 'none')
"
  else
    echo "Tools list HTTP ${TOOLS_CODE} (server registered; retry after MCP is running)"
  fi
  exit 0
fi

echo "Failed to register MCP (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-mcp-register.json
exit 1
