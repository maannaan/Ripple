# Phase 4: Subagent orchestration

Ripple Phase 4 enables **TrueForge dynamic subagents** on the `ripple` agent. The harness spawns focused subagents at runtime; each gets isolated context and returns only its result to the root agent.

## Architecture

```mermaid
sequenceDiagram
  participant User
  participant Ripple as ripple_root
  participant Fetch as subagent_fetch
  participant Sim as subagent_simulate
  participant MCP as MCP_tools
  participant Sandbox as simulate_change

  User->>Ripple: ACME-1847 to ACME-2847
  Ripple->>Fetch: delegate MCP reads
  Fetch->>MCP: get_product + find_*
  Fetch-->>Ripple: structured JSON
  Ripple->>Sim: delegate simulation
  Sim->>Sandbox: simulate_change.py
  Sim-->>Ripple: revenue 21850 + counts
  Ripple-->>User: Impact Report
  User->>Ripple: Approve safe updates
  Ripple->>MCP: apply_product_update
  Note over Ripple,MCP: TrueForge approval gate
```

| Role | Responsibility | Writes DB? |
|------|----------------|------------|
| **Fetch subtask** | `get_product` + all `find_*` MCP calls | No |
| **Simulate subtask** | Sandbox `simulate_change.py` | No |
| **Root agent** | Impact Report, approval gate, `apply_product_update` | Yes (gated) |

## Manifest (Phase 4)

Configured in [`scripts/lib/agent-manifest.sh`](../../scripts/lib/agent-manifest.sh):

```json
"config": {
  "sandbox": { "enabled": true, "file_downloads": true },
  "dynamic_sub_agents": { "enabled": true }
}
```

Apply to TrueForge:

```bash
npm run agent:update
npm run verify:phase4
```

## Instruction files

| File | Purpose |
|------|---------|
| [`agent/instructions.md`](../../agent/instructions.md) | **Shipped** — orchestration + demo workflow |
| [`agent/instructions-orchestrator.md`](../../agent/instructions-orchestrator.md) | Reference — root coordinator role |
| [`agent/instructions-analyst.md`](../../agent/instructions-analyst.md) | Reference — fetch + simulate role |

## Completion checklist

- [x] `dynamic_sub_agents.enabled: true` in agent manifest (`agent-manifest.sh`)
- [x] Orchestration instructions in `instructions.md` (fetch → simulate delegation)
- [x] `npm run verify:phase4` verification script
- [x] Demo agent `ripple` upgraded (not a separate orchestrator agent)
- [ ] Manual: Scenario A chat shows subagent threads in TrueForge UI (optional video beat)

## Testing

- **Static / manifest:** `npm run verify:phase4`
- **Logic path (no UI):** `npm run e2e:pipeline` — see [docs/TESTING.md](../TESTING.md)
- **Harness proof:** [docs/DEMO.md](../DEMO.md) manual chat + approval gate

## References

- Agent setup: [`scripts/create-ripple-agent.sh`](../../scripts/create-ripple-agent.sh), [`scripts/update-ripple-agent.sh`](../../scripts/update-ripple-agent.sh)
- TrueForge harness: [dynamic subagents](https://trueforge.dev/create-agent/overview)
