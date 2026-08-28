# Agent configuration

Ripple agent for TrueForge using **Fireworks** (default) with sandbox simulation.

## Setup

```bash
npm run trueforge
npm run db:setup
npm run mcp:dev
npm run mcp:register
npm run skill:sync
npm run agent:update          # Fireworks + sandbox enabled
```

Register skill after GitHub push:

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<org>/Ripple
npm run skill:register
npm run agent:update
```

## Try it

Open http://localhost:8790 → Agents → **ripple**:

```
What is the impact of changing SKU ACME-1847 to ACME-2847?
```

Expect MCP tool calls, sandbox `simulate_change.py`, revenue **21850**, POs **101/102**.

## Files

- `instructions.md` — system prompt
- `skills/ripple-simulation/` — TrueForge skill (SKILL.md + simulate_change.py)
