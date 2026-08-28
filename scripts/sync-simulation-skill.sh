#!/usr/bin/env bash
# Copy simulation/simulate_change.py into the TrueForge skill folder.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/agent/skills/ripple-simulation"
cp "$ROOT/simulation/simulate_change.py" "$ROOT/agent/skills/ripple-simulation/simulate_change.py"
echo "Synced simulate_change.py -> agent/skills/ripple-simulation/"
