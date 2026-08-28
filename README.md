# Ripple

Ripple is a TrueForge-powered change-impact analysis agent for supply-chain and operations teams. Before you replace a SKU, swap a supplier part, or change pricing, Ripple queries operational data (orders, shipments, purchase orders, pricing rules), simulates the downstream blast radius in a sandbox, and only applies safe database updates after explicit human approval.

Product specification: [docs/design/](docs/design/README.md) (see design doc at repo root).

## Prerequisites

- **Node.js** 22.14 or newer
- **Anthropic API key** for Claude (configured in TrueForge UI)
- **Docker** and **Docker Compose** (for local Postgres)
- **npm** 9+

You do **not** need to clone the [TrueForge](https://github.com/truefoundry/trueforge) repository for local development. Run TrueForge via `npx`.

**Model providers:** Ripple is configured for **Google Gemini** (default) and **Fireworks**. OpenAI is optional.

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Check environment

```bash
npm run check
```

### 3. Start database (Docker Postgres)

```bash
npm run db:setup
```

### 4. Start TrueForge

```bash
npm run trueforge
```

Open [http://localhost:8790](http://localhost:8790). Configure **Google Gemini** and/or **Fireworks** under Settings → Models (you already have these).

### 5. Start MCP server

```bash
npm run mcp:dev
```

### 6. Register MCP + create Ripple agent

```bash
npm run mcp:register
npm run agent:create
```

Or one-shot (DB only; MCP/agent need servers running):

```bash
npm run ripple:setup
```

**Model note:** Default agent uses `google-gemini/gemini-3-6-flash`. If Gemini returns a billing/credits error, recreate with Fireworks:

```bash
# delete existing 'ripple' agent in UI first, or use a new name
RIPPLE_AGENT_NAME=ripple-fw RIPPLE_MODEL=fireworks/minimax-m3 npm run agent:create
```

Or: `npm run agent:create:fireworks` (set `RIPPLE_AGENT_NAME` if `ripple` already exists).

### 7. Run Ripple

Open http://localhost:8790 → **Agents** → **ripple** → ask:

```
What is the impact of changing SKU ACME-1847 to ACME-2847?
```

The agent should call MCP tools and return real IDs from Postgres.

## Phase 3 — Simulation (sandbox)

```bash
pip install pytest          # once, for tests
npm run simulation:test       # unit tests
npm run simulation:run        # local CLI → revenue 21850
npm run skill:sync            # copy script into skill folder
npm run agent:update          # Fireworks model + sandbox enabled
npm run verify:phase3
```

Register skill after pushing to GitHub:

```bash
export RIPPLE_SKILL_GIT_URL=https://github.com/<org>/Ripple
npm run skill:register
npm run agent:update
```

Chat test (Fireworks): *"Impact of changing SKU ACME-1847 to ACME-2847"* — expect revenue **21850**, POs **101/102**, orders **9001/9002**.

## Phase 5 — Approval + safe mutations

```bash
npm run db:migrate          # existing volumes: add audit_log + needs_remapping
npm run test:apply          # reset DB, apply SKU update, verify audit + flags
npm run agent:update        # approval gate on apply_product_update
npm run verify:phase5
```

E2E demo loop:

1. `npm run db:reset && npm run db:migrate`
2. `npm run trueforge` and `npm run mcp:dev`
3. Agents → **ripple** → *"Impact of ACME-1847 → ACME-2847"*
4. Review report (revenue **21850**)
5. *"Approve safe updates"* → click **Allow** on `apply_product_update`
6. Verify: `SELECT sku FROM products WHERE product_id=1;` → `ACME-2847`; shipment **5002** `needs_remapping=true`

Reset for re-demo: `npm run db:reset`

---

## Legacy Phase 0 steps

```bash
npm run trueforge
```

Open [http://localhost:8790](http://localhost:8790).

If port 8790 is in use:

```bash
TRUEFORGE_PORT=8792 npm run trueforge
```

Optional: isolate TrueForge SQLite data:

```bash
SQLITE_PATH=~/.ripple/trueforge.sqlite npm run trueforge
```

### 5. Configure Anthropic (manual, one-time)

1. Open **Settings → Models**
2. Select **Anthropic** from the catalog
3. Paste your API key and click **Create**
4. Pick a model (e.g. `anthropic/claude-sonnet-4-6` or latest available)

Store your key in a local `.env` file (copy from `.env.example`). Either paste it in the TrueForge UI, or configure via API:

```bash
export ANTHROPIC_API_KEY=your-key
npm run configure:anthropic
```

### 6. Smoke test

In the chat UI, send:

```
Reply with exactly: RIPPLE_PHASE0_OK
```

The model should respond with `RIPPLE_PHASE0_OK`.

### 7. (Optional) MCP connector sanity check

Before building Ripple's custom MCP server (Phase 2), you can verify connectors work:

1. **Settings → Connectors**
2. Connect **Exa** (no auth) from the catalog

### 8. MCP server stub (Phase 0)

```bash
npm run mcp:dev
```

Health check:

```bash
curl http://localhost:3100/health
```

Expected: `{"status":"ok","service":"ripple-mcp"}`

## Repository layout

| Path | Purpose |
|------|---------|
| `db/` | Postgres schema, seed data, Docker setup (`docker-compose.yml`) |
| `mcp-server/` | Phase 2: MCP tools for operational data |
| `simulation/` | Phase 3: deterministic sandbox simulation |
| `agent/` | Phase 4: TrueForge agent instructions and spec |
| `scripts/` | Dev helpers (`start-trueforge.sh`, `check-env.sh`) |
| `docs/design/` | Product design documentation |

## Phase roadmap

| Phase | Focus |
|-------|--------|
| **0** | TrueForge local runtime, repo scaffold, Anthropic model (this phase) |
| **1** | Database schema + Scenario A seed data (Docker Postgres) |
| **2** | MCP read tools (`get_product`, `find_*`) |
| **3** | Sandbox simulation (`simulate_change`) — **done** |
| **4** | Ripple agent orchestration + subagents |
| **5** | Human approval gate + safe DB mutations — **done** |
| **6** | Demo polish, README, CI, hackathon submission |

## Environment variables

See [.env.example](.env.example). Copy to `.env` locally; never commit `.env`.

## Git remote

If you have an existing GitHub repo:

```bash
git remote add origin <your-github-repo-url>
```

## Phase 0 verification

With TrueForge and MCP stub running:

```bash
npm run verify:phase0
```

Manual gates: configure Anthropic (G0.3) and chat smoke test `RIPPLE_PHASE0_OK` (G0.4).

## Hackathon submission checklist (Phase 6)

- [ ] Public GitHub repository
- [ ] README with setup and demo steps
- [ ] Working end-to-end demo (fetch → simulate → approve → execute)
- [ ] Demo video (~3 minutes)
- [ ] CI passing (`npm run ci`)
- [ ] Qodo code review evidence (if required)
- [ ] Blog post (optional prize track)

## License

MIT (planned for hackathon release)
