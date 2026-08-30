# Self-hosted deployment

Ripple production mode runs in **your** environment: Docker Postgres (cache/audit), Ripple MCP gateway, and TrueForge for the agent UI.

## Prerequisites

- Docker 24+ and Docker Compose v2
- Node.js 22+ (for TrueForge on the host)
- LLM API key (Fireworks or Gemini) in TrueForge Settings

## Quick start (production compose)

```bash
cp .env.example .env
# Set POSTGRES_PASSWORD and MCP_API_KEYS in .env

docker compose -f deploy/docker-compose.prod.yml up -d --build
```

Verify:

```bash
curl http://localhost:3100/health
curl http://localhost:3100/metrics
```

## Configuration

| File | Purpose |
|------|---------|
| [`config/ripple.config.example.yaml`](../config/ripple.config.example.yaml) | Data source, OIDC, audit export |
| [`config/policies.yaml`](../config/policies.yaml) | Auto-apply vs manual rules |
| [`config/erp-status-map.yaml`](../config/erp-status-map.yaml) | ERP status → Ripple canonical |

Copy example config:

```bash
cp config/ripple.config.example.yaml config/ripple.config.yaml
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes (prod) | Database password |
| `DATABASE_URL` | Yes | Postgres connection string |
| `MCP_API_KEYS` | Recommended | `key:analyst+approver:label,key2:admin:ops` |
| `RIPPLE_DATA_SOURCE` | No | `postgres` (default) or `netsuite` |
| `RIPPLE_READ_ONLY` | No | `true` blocks all writes |
| `AUDIT_EXPORT_WEBHOOK_URL` | No | SIEM webhook for audit events |
| `OTEL_ENABLED` | No | `true` + `OTEL_EXPORTER_OTLP_ENDPOINT` for traces |

## TrueForge (agent UI)

Ripple MCP does not include TrueForge. On the same host or a trusted network:

```bash
npm run trueforge
npm run mcp:register
npm run agent:update
```

Point TrueForge MCP URL at your deployed MCP (`http://<host>:3100/mcp`).

## Secrets

- Store ERP credentials in Vault, AWS Secrets Manager, or K8s secrets — never in git
- Rotate `MCP_API_KEYS` on a schedule
- Use strong `POSTGRES_PASSWORD` in production

## Upgrades

```bash
docker compose -f deploy/docker-compose.prod.yml pull
docker compose -f deploy/docker-compose.prod.yml up -d --build
```

Drain in-flight migration jobs before upgrade (see [RUNBOOK.md](RUNBOOK.md)).

## Backup

Backup **only** the Ripple cache DB (audit log, migration jobs):

```bash
docker exec ripple-postgres-prod pg_dump -U ripple ripple > ripple-backup.sql
```

ERP remains the system of record when using NetSuite connector.

## Networking

- Bind MCP to internal network only; expose via reverse proxy with TLS
- Set `ALLOWED_ORIGINS` if using browser clients
- Forward `X-OIDC-Sub` / `X-OIDC-Email` from your IdP for actor attribution

See also: [CONNECTORS.md](CONNECTORS.md), [RUNBOOK.md](RUNBOOK.md)
