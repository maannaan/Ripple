#!/usr/bin/env bash
# Return 0 if TrueForge has skill "ripple-simulation" registered by exact name.
skill_registered() {
  local base="${1:-http://localhost:8790}"
  local skills
  skills="$(curl -sf "${base}/api/v1/settings/skills" 2>/dev/null)" || return 1
  echo "$skills" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin).get('data', [])
    sys.exit(0 if any(s.get('name') == 'ripple-simulation' for s in data) else 1)
except json.JSONDecodeError:
    sys.exit(1)
"
}
