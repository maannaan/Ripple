# Ripple operations runbook

## Health checks

```bash
curl -s http://localhost:3100/health | jq .
curl -s http://localhost:3100/metrics | jq .
```

Expected: `status: ok`, `dataSource: postgres` or `netsuite`.

## Common incidents

### MCP returns 401

**Cause:** `MCP_API_KEYS` set but client missing `Authorization: Bearer <key>`.

**Fix:** Register key in TrueForge MCP settings or disable keys for local dev (unset `MCP_API_KEYS`).

### MCP returns 429

**Cause:** Rate limit exceeded (`MCP_RATE_LIMIT` per window).

**Fix:** Increase limit or reduce agent retry storms.

### Health degraded — adapter down

**Postgres:** Check `DATABASE_URL`, container health, disk space.

**NetSuite:** Verify OAuth/token expiry, `baseUrl`, account ID. Run with `RIPPLE_READ_ONLY=true` until restored.

### Migration job stuck in `executing`

1. Check MCP logs for ERP errors
2. Query job: `get_migration_job_status` tool or SQL:

```sql
SELECT * FROM migration_jobs WHERE job_id = <id>;
SELECT * FROM migration_steps WHERE job_id = <id>;
```

3. If ERP partially applied, follow ERP-specific rollback (document per customer)
4. Mark job `failed` manually only after ops review:

```sql
UPDATE migration_jobs SET status = 'failed', updated_at = now() WHERE job_id = <id>;
```

### Wrong revenue in agent report

**Cause:** Simulation skipped or stale MCP data.

**Fix:** Confirm agent ran `simulate_change.py`; reset demo DB with `npm run demo:prep` for Scenario A.

## Rollback

| Action | Reversible? | Procedure |
|--------|-------------|-----------|
| Product SKU update | Partial | Restore previous SKU via new migration job |
| Shipment `needs_remapping` flag | Yes | Clear flag in DB or ERP |
| Customer orders | Manual | Never auto-migrated by policy |

## Upgrade procedure

1. Announce maintenance window
2. List pending jobs: `SELECT * FROM migration_jobs WHERE status IN ('pending_approval','approved','executing');`
3. Complete or cancel pending jobs
4. `docker compose -f deploy/docker-compose.prod.yml up -d --build`
5. Run `npm run rehearsal:verify`
6. Smoke test: impact query + read-only apply rejection

## Audit export

When `AUDIT_EXPORT_WEBHOOK_URL` is set, completed migration jobs POST JSON to your SIEM. Verify delivery after each deploy.

## Escalation

| Severity | Example | Response |
|----------|---------|----------|
| P1 | Unauthorized write | Disable MCP, rotate API keys |
| P2 | ERP connector down | Enable read-only, notify ops |
| P3 | Slow simulation | Check sandbox / agent logs |
