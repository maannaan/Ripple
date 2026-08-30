#!/usr/bin/env bash
# Micro-benchmark simulate_change.py across all fixtures (fixture-only, no DB).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ITERATIONS="${BENCHMARK_ITERATIONS:-1000}"
MCP_PORT="${MCP_PORT:-3100}"

echo "=== Ripple simulation micro-benchmark ==="
echo "Iterations per fixture: ${ITERATIONS}"
echo ""

python3 - "$ITERATIONS" <<'PY'
import importlib.util
import json
import sys
import time
from pathlib import Path

iterations = int(sys.argv[1])
sim_dir = Path("simulation")
fixtures_dir = sim_dir / "fixtures"

spec = importlib.util.spec_from_file_location(
    "simulate_change", sim_dir / "simulate_change.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

expectations = json.loads((fixtures_dir / "expectations.json").read_text())

for name in sorted(expectations):
    fixture = json.loads((fixtures_dir / f"{name}.json").read_text())
    # Warm-up
    mod.simulate_change(fixture)

    start = time.perf_counter()
    for _ in range(iterations):
        mod.simulate_change(fixture)
    elapsed = time.perf_counter() - start

    per_run_ms = (elapsed / iterations) * 1000
    runs_per_sec = iterations / elapsed
    print(f"{name}:")
    print(f"  per_run_ms: {per_run_ms:.4f}")
    print(f"  runs_per_sec: {runs_per_sec:.0f}")
    print(f"  total_sec: {elapsed:.3f} ({iterations} runs)")
    print("")
PY

if curl -sf "http://localhost:${MCP_PORT}/health" >/dev/null 2>&1; then
  echo "MCP health latency (10 round-trips):"
  total_ms=0
  for _ in $(seq 1 10); do
  start_ns=$(python3 -c "import time; print(int(time.perf_counter()*1e9))")
  curl -sf "http://localhost:${MCP_PORT}/health" >/dev/null
  end_ns=$(python3 -c "import time; print(int(time.perf_counter()*1e9))")
  ms=$(( (end_ns - start_ns) / 1000000 ))
  total_ms=$((total_ms + ms))
  done
  avg_ms=$((total_ms / 10))
  echo "  avg_ms: ${avg_ms}"
else
  echo "MCP health: skipped (npm run mcp:dev to include latency smoke)"
fi

echo ""
echo "Done. See docs/BENCHMARKS.md for methodology."
