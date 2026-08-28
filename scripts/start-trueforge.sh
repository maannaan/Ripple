#!/usr/bin/env bash
set -euo pipefail

PORT="${TRUEFORGE_PORT:-8790}"
export PORT

if [[ -n "${SQLITE_PATH:-}" ]]; then
  export SQLITE_PATH
fi

echo "Starting TrueForge at http://localhost:${PORT}"
npx @truefoundry/trueforge@latest
