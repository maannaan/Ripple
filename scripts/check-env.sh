#!/usr/bin/env bash
set -euo pipefail

FAIL=0
TRUEFORGE_PORT="${TRUEFORGE_PORT:-8790}"
MCP_SERVER_PORT="${MCP_SERVER_PORT:-3100}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "FAIL: node is not installed"
    FAIL=1
    return
  fi

  NODE_VERSION="$(node -p "process.versions.node")"
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  NODE_MINOR="$(node -p "process.versions.node.split('.')[1]")"

  if [[ "$NODE_MAJOR" -lt 22 ]] || [[ "$NODE_MAJOR" -eq 22 && "$NODE_MINOR" -lt 14 ]]; then
    echo "FAIL: Node ${NODE_VERSION} found; require >= 22.14"
    FAIL=1
  else
    echo "PASS: Node ${NODE_VERSION} (>= 22.14)"
  fi
}

check_port() {
  local port="$1"
  local name="$2"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i ":${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "WARN: port ${port} in use (${name})"
    else
      echo "PASS: port ${port} free (${name})"
    fi
  else
    echo "SKIP: lsof not available; cannot check port ${port}"
  fi
}

soft_http_check() {
  local url="$1"
  local name="$2"
  if command -v curl >/dev/null 2>&1; then
    if curl -sf "$url" >/dev/null 2>&1; then
      echo "PASS: ${name} reachable at ${url}"
    else
      echo "INFO: ${name} not reachable at ${url} (start with npm run trueforge or npm run mcp:dev)"
    fi
  else
    echo "SKIP: curl not available; cannot check ${name}"
  fi
}

check_node
check_port "$TRUEFORGE_PORT" "TrueForge"
check_port "$MCP_SERVER_PORT" "MCP server"
check_port "$POSTGRES_PORT" "Ripple Postgres (Docker)"
soft_http_check "http://localhost:${TRUEFORGE_PORT}" "TrueForge"
soft_http_check "http://localhost:${MCP_SERVER_PORT}/health" "MCP server"

if [[ "$FAIL" -ne 0 ]]; then
  echo "Environment check failed."
  exit 1
fi

echo "Environment check passed."
