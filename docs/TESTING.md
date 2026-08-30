# Ripple testing guide

Ripple has **three layers** of verification: simulation unit tests, automated logic pipeline, and manual TrueForge chat.

## Quick reference

| Command | Layer | TrueForge UI | Docker |
|---------|-------|--------------|--------|
| `npm run simulation:test` | Simulation fixtures A/B/C | No | No |
| `npm run benchmark:simulation` | Simulation micro-benchmarks | No | No |
| `npm run test:apply` | DB apply integration | No | Yes |
| `npm run e2e:pipeline` | Full logic path (read → sim → apply) | No | Yes |
| `npm run verify:phase4` | Phase 4 manifest + orchestration instructions | Optional | No |
| `npm run rehearsal:verify` | Pre-flight (sim + MCP + DB) | Optional check | Yes |
| `docs/DEMO.md` chat | Judge demo (LLM + approval gate) | **Yes** | Yes |

## Automated logic pipeline (`e2e:pipeline`)

Replicates the agent workflow **without** the LLM or TrueForge UI:

1. Reset DB to Scenario A (`ACME-1847`)
2. Read product, POs, shipments, orders, pricing via [`mcp-server/src/db.ts`](../mcp-server/src/db.ts) (same queries as MCP tools)
3. Run [`simulation/simulate_change.py`](../simulation/simulate_change.py) and assert golden numbers (revenue **21850**, POs **101/102**, shipment **5002** in transit)
4. Reject wrong `old_sku`, then `apply_product_update` for `ACME-1847` → `ACME-2847`
5. Verify SKU update, shipment **5002** `needs_remapping`, audit row

```bash
npm run e2e:pipeline
```

This runs in CI-friendly environments with Docker Postgres only — no TrueForge process required.

## Why TrueForge chat is still manual

The repo configures TrueForge via HTTP for agents, MCP, and skills (`/api/v1/agents`, `/api/v1/settings/*`), but there is **no stable chat/run API** used for automated assertions. Phase 0 marks chat as a manual smoke test (`RIPPLE_PHASE0_OK`).

| Automated | Manual |
|-----------|--------|
| Correct revenue math | LLM tool selection and narration |
| DB mutations and audit | Approval gate UI (**Allow** on `apply_product_update`) |
| MCP health | Judge-facing demo flow |

For hackathon submission, use **`e2e:pipeline`** for regression and **`docs/DEMO.md`** for the recorded demo.

## Simulation scenarios

See [simulation/README.md](../simulation/README.md) for fixtures `scenario_a`, `scenario_b`, `scenario_c` and golden expectations in `simulation/fixtures/expectations.json`.

## Benchmarks

See [docs/BENCHMARKS.md](BENCHMARKS.md) for `npm run benchmark:simulation`.

## Full verification stack

```bash
npm run ci                 # build + simulation tests
npm run verify:phase4      # Phase 4 orchestration + manifest checks
npm run e2e:pipeline       # logic E2E with Docker
npm run rehearsal:verify   # requires mcp:dev + DB
# Manual: docs/DEMO.md chat twice before video
```
