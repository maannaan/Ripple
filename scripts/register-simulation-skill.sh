#!/usr/bin/env bash
# Register ripple-simulation skill in TrueForge (requires public GitHub repo URL).
set -euo pipefail

TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
BASE="http://localhost:${TRUEFORGE_PORT}"
NAME="ripple-simulation"
GIT_URL="${RIPPLE_SKILL_GIT_URL:-}"
GIT_REF="${RIPPLE_SKILL_GIT_REF:-main}"
SKILL_PATH="${RIPPLE_SKILL_PATH:-agent/skills/ripple-simulation}"

if ! curl -sf "${BASE}" >/dev/null 2>&1; then
  echo "TrueForge not running at ${BASE}"
  exit 1
fi

EXISTING="$(curl -sf "${BASE}/api/v1/settings/skills" || echo '{}')"
if echo "$EXISTING" | grep -q "\"name\": \"${NAME}\""; then
  echo "Skill '${NAME}' already registered."
  exit 0
fi

if [[ -z "$GIT_URL" ]]; then
  echo "Skill '${NAME}' is not registered yet."
  echo ""
  echo "TrueForge skills require a public GitHub/GitLab URL."
  echo "After pushing this repo, register manually:"
  echo "  Settings → Skills → Import from GitHub"
  echo "  URL: https://github.com/<org>/Ripple"
  echo "  Path: ${SKILL_PATH}"
  echo "  Ref: ${GIT_REF}"
  echo ""
  echo "Or set env and re-run:"
  echo "  export RIPPLE_SKILL_GIT_URL=https://github.com/<org>/Ripple"
  echo "  npm run skill:register"
  exit 0
fi

BODY=$(cat <<EOF
{
  "manifest": {
    "type": "git",
    "name": "${NAME}",
    "url": "${GIT_URL}",
    "path": "${SKILL_PATH}",
    "ref": "${GIT_REF}",
    "description": "Deterministic SKU change-impact simulation via simulate_change.py in sandbox"
  }
}
EOF
)

HTTP_CODE=$(curl -s -o /tmp/ripple-skill-register.json -w "%{http_code}" \
  -X POST "${BASE}/api/v1/settings/skills" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if [[ "$HTTP_CODE" == "201" ]]; then
  echo "Registered skill '${NAME}' from ${GIT_URL} path=${SKILL_PATH}"
  exit 0
fi

echo "Failed to register skill (HTTP ${HTTP_CODE}):"
cat /tmp/ripple-skill-register.json
exit 1
