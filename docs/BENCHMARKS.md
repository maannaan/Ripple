# Ripple benchmarks

Honest **micro-benchmarks** for the deterministic simulation layer. These are not load tests against Postgres or TrueForge.

## Run

```bash
npm run benchmark:simulation
```

Optional: more iterations

```bash
BENCHMARK_ITERATIONS=10000 npm run benchmark:simulation
```

With MCP running (`npm run mcp:dev`), the script also prints average `/health` round-trip latency (10 samples).

## Methodology

| Aspect | Detail |
|--------|--------|
| **What is measured** | `simulate_change()` in-process Python calls |
| **Input** | JSON fixtures under `simulation/fixtures/` (no database) |
| **Default iterations** | 1000 per fixture (`BENCHMARK_ITERATIONS`) |
| **Metrics** | `per_run_ms`, `runs_per_sec`, `total_sec` |
| **MCP smoke** | Optional `curl` to `http://localhost:3100/health` when server is up |

## Sample output (template)

```
=== Ripple simulation micro-benchmark ===
Iterations per fixture: 1000

scenario_a:
  per_run_ms: 0.0123
  runs_per_sec: 81300
  total_sec: 0.012 (1000 runs)

scenario_b:
  per_run_ms: 0.0098
  runs_per_sec: 102000
  total_sec: 0.010 (1000 runs)

scenario_c:
  per_run_ms: 0.0110
  runs_per_sec: 90900
  total_sec: 0.011 (1000 runs)

MCP health latency (10 round-trips):
  avg_ms: 2

Done. See docs/BENCHMARKS.md for methodology.
```

Numbers vary by machine. Re-run locally to reproduce.

## Non-goals

- k6 / Locust / concurrent user simulation
- Postgres query throughput
- TrueForge agent chat latency
- Multi-node or production sizing

For end-to-end logic coverage without the TrueForge UI, use `npm run e2e:pipeline` (see [docs/TESTING.md](TESTING.md)).
