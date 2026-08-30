# Ripple demo script (~3 minutes)

Judge-ready walkthrough for the Agent Harness Hackathon. Full loop: **fetch → simulate → approve → execute**.

## Before you record

```bash
npm install
npm run demo:prep          # resets DB to Scenario A seed
npm run trueforge          # terminal 1 → http://localhost:8790
npm run mcp:dev            # terminal 2
npm run mcp:register       # once, with TrueForge running
npm run agent:update       # Fireworks + sandbox + approval gate
```

Configure **Fireworks** (or Gemini) under TrueForge **Settings → Models**.

After pushing to GitHub, register the simulation skill:

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<you>/Ripple
npm run skill:register
npm run agent:update
```

## Video beats (180 seconds)

| Time | Beat | What to show |
|------|------|----------------|
| 0:00–0:30 | Problem | SKU change in supply chain affects POs, shipments, orders, pricing — need blast-radius before mutating data |
| 0:30–1:00 | Stack | TrueForge UI, **ripple** agent, MCP `ripple-data` connector, Docker Postgres |
| 1:00–1:45 | Analyze | Chat prompt below; show tool calls and optional **subagent threads** (`get_product`, `find_*`, sandbox `simulate_change.py`) |
| 1:45–2:15 | Report | Revenue **21850**, POs **101/102**, orders **9001/9002** manual, shipment **5002** in transit |
| 2:15–2:45 | Approve | *"Approve safe updates"* → TrueForge pauses → click **Allow** on `apply_product_update` |
| 2:45–3:00 | Verify | Agent confirms `audit_id`; optional SQL below |

## Exact chat prompts

**Step 1 — Impact analysis**

```
What is the impact of changing SKU ACME-1847 to ACME-2847?
```

**Expected tool calls:** `get_product`, `find_purchase_orders`, `find_shipments`, `find_customer_orders`, `find_pricing_rules`, sandbox `simulate_change.py`.

**Expected numbers:**

- Revenue at risk: **21850**
- Purchase orders: **101**, **102**
- Customer orders (manual review): **9001**, **9002**
- In-transit shipment: **5002**
- Safe auto-updates: product SKU, flag shipment **5002**

**Step 2 — Approval**

```
Approve safe updates
```

TrueForge shows **Allow / Deny** for `apply_product_update`. Click **Allow**.

**Step 3 — Verify (optional on screen)**

```
get_product for SKU ACME-2847
```

Or in terminal:

```bash
docker compose exec -T postgres psql -U ripple -d ripple -c \
  "SELECT sku FROM products WHERE product_id=1; SELECT shipment_id, needs_remapping FROM shipments WHERE product_id=1;"
```

Expected: `ACME-2847`, shipment **5002** `needs_remapping = t`.

## Failure recovery

| Issue | Fix |
|-------|-----|
| DB already mutated | `npm run demo:prep` |
| Gemini credits error | Use Fireworks: `npm run agent:update` (default model `fireworks/minimax-m3`) |
| Sandbox / skill missing | `npm run skill:register` after public GitHub push; if git skill init fails in sandbox, agent uses curl fallback (see `agent/instructions.md`); or run `sudo xcode-select --switch /Library/Developer/CommandLineTools` and restart TrueForge |
| MCP errors | `npm run mcp:dev` + `curl http://localhost:3100/health` |
| Wrong revenue / IDs | Agent skipped sandbox — check skill registered and sandbox enabled |

## Reset for another run

```bash
npm run db:reset
```
