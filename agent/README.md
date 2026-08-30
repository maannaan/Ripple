# Agent configuration

Ripple agent for TrueForge using **Fireworks** (`fireworks/minimax-m3`) with sandbox simulation, **dynamic subagents** (Phase 4), and approval-gated mutations.

## Setup

```bash
npm run trueforge
npm run demo:prep
npm run mcp:dev
npm run mcp:register
npm run skill:sync
npm run agent:update
npm run verify:phase4
```

Register skill after GitHub push:

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<you>/Ripple
npm run skill:register
npm run agent:update:phase4
```

## Orchestration (Phase 4)

The `ripple` agent delegates via TrueForge harness subagents:

1. **Fetch subtask** — MCP reads (`get_product`, `find_*`)
2. **Simulate subtask** — sandbox `simulate_change.py`
3. **Root agent** — Impact Report, approval gate, `apply_product_update`

See [docs/design/PHASE4_SUBAGENTS.md](../docs/design/PHASE4_SUBAGENTS.md).

## Demo flow

See [docs/DEMO.md](../docs/DEMO.md) for the full 3-minute script.

1. *"What is the impact of changing SKU ACME-1847 to ACME-2847?"*
2. Review Impact Report (revenue **21850**, manual orders **9001/9002**); optional: show subagent threads in UI
3. *"Approve safe updates"* → **Allow** on `apply_product_update`
4. Verify SKU **ACME-2847** and shipment **5002** flagged

## Files

- `instructions.md` — system prompt (orchestration + analysis + approval gate)
- `instructions-orchestrator.md` / `instructions-analyst.md` — reference role splits
- `skills/ripple-simulation/` — TrueForge skill (SKILL.md + simulate_change.py)
