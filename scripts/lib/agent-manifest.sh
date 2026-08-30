#!/usr/bin/env bash
# Build Ripple agent manifest JSON (Phase 4: dynamic subagents + sandbox).
ripple_build_manifest() {
  local instructions_file="$1"
  local model="$2"
  local skills_json="${3:-[]}"

  INSTRUCTIONS_FILE="$instructions_file" \
  MODEL="$model" \
  SKILLS_JSON="$skills_json" \
  python3 <<'PY'
import json
import os

instructions_file = os.environ["INSTRUCTIONS_FILE"]
model = os.environ["MODEL"]
skills = json.loads(os.environ.get("SKILLS_JSON", "[]"))

manifest = {
    "model": {"name": model},
    "instructions": open(instructions_file, encoding="utf-8").read(),
    "mcp_servers": [
        {
            "name": "ripple-data",
            "preload_tools": ["get_product"],
            "require_approval_for_tools": [
                "apply_product_update",
                "@write",
                "@destructive",
            ],
        }
    ],
    "skills": skills,
    "config": {
        "sandbox": {"enabled": True, "file_downloads": True},
        "dynamic_sub_agents": {"enabled": True},
    },
}

print(json.dumps(manifest))
PY
}

ripple_skills_json() {
  local base="$1"
  local lib_dir
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  # shellcheck source=skill-registered.sh
  source "${lib_dir}/skill-registered.sh"
  if skill_registered "${base}"; then
    echo '[{"name": "ripple-simulation"}]'
  else
    echo '[]'
  fi
}
