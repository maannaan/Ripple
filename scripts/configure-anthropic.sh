#!/usr/bin/env bash
# Configure Anthropic provider in local TrueForge via API (requires ANTHROPIC_API_KEY).
set -euo pipefail

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Set ANTHROPIC_API_KEY in your environment or .env file."
  exit 1
fi

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
BASE="http://localhost:${TRUEFORGE_PORT}"

# Check TrueForge is up
if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}. Start with: npm run trueforge"
  exit 1
fi

# Skip if already configured
EXISTING="$(curl -sf "${BASE}/api/v1/settings/model-providers" || echo '{}')"
if echo "$EXISTING" | grep -q '"anthropic"'; then
  echo "Anthropic provider already configured."
  exit 0
fi

BODY=$(cat <<EOF
{
  "manifest": {
    "type": "anthropic",
    "auth": { "api_key": "${ANTHROPIC_API_KEY}" },
    "models": [
      {
        "name": "claude-sonnet",
        "model_id": "claude-sonnet-4-20250514",
        "properties": {}
      }
    ]
  }
}
EOF
)

HTTP_CODE=$(curl -s -o /tmp/ripple-anthropic-resp.json -w "%{http_code}" \
  -X POST "${BASE}/api/v1/settings/model-providers" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Anthropic provider created. Open ${BASE} and select model claude-sonnet."
  exit 0
fi

echo "Failed to create provider (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-anthropic-resp.json
exit 1
