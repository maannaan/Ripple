# Ripple simulation

Deterministic change-impact analysis for SKU swaps. **No database access** — input is JSON from MCP tool results.

## Run locally

```bash
python3 simulation/simulate_change.py --fixture scenario_a
```

Expected `revenue_exposure`: **21850** (Scenario A: 10×850 + 15×890).

```bash
npm run simulation:test
npm run simulation:run
```

## Scenarios

| Fixture | SKU change | Revenue | In-transit to flag | Notes |
|---------|------------|---------|-------------------|-------|
| `scenario_a` | ACME-1847 → ACME-2847 | **21850** | **5002** | Demo / hackathon golden path |
| `scenario_b` | BETA-9001 → BETA-9002 | **7500** | none | Second product; delivered shipment only |
| `scenario_c` | ACME-1847 → ACME-2847 | **0** | **5002** | Edge: customer orders closed (no open revenue) |

Golden expectations live in `simulation/fixtures/expectations.json`. Run any fixture:

```bash
python3 simulation/simulate_change.py --fixture scenario_b
python3 simulation/simulate_change.py --fixture scenario_c
```

## Input schema

| Field | Description |
|-------|-------------|
| `old_sku` | SKU being replaced |
| `new_sku` | Target SKU |
| `product` | `get_product` result |
| `purchase_orders` | `find_purchase_orders` result |
| `shipments` | `find_shipments` result |
| `customer_orders` | `find_customer_orders` result |
| `pricing_rules` | `find_pricing_rules` result |

## Output

Structured JSON with `counts`, `quantities`, `revenue_exposure`, `details` (record IDs), `safe_auto_updates`, `recommendations`.

## TrueForge skill

Skill files live in `agent/skills/ripple-simulation/` (sync with `npm run skill:sync`).

Register in TrueForge after pushing to GitHub:

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<org>/Ripple
npm run skill:register
```

Or: Settings → Skills → Import → path `agent/skills/ripple-simulation`.

Agent must have `config.sandbox.enabled: true` and skill `ripple-simulation` attached (`npm run agent:update`).
