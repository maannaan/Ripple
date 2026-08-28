# Ripple database (Docker Postgres)

Local development uses **Docker Compose** for Postgres — no local Postgres install required.

## Quick start

```bash
npm run db:setup
```

Or manually:

```bash
docker compose up -d postgres
```

## Connection

Default URL (port **5433** avoids clashing with a local Postgres on 5432):

```
postgres://ripple:ripple@localhost:5433/ripple
```

Set in `.env`:

```bash
DATABASE_URL=postgres://ripple:ripple@localhost:5433/ripple
```

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Tables: products, purchase_orders, shipments, customer_orders, pricing_rules |
| `seed.sql` | Scenario A demo data (SKU `ACME-1847`) |

Schema and seed run automatically on **first** container start via `docker-entrypoint-initdb.d/`.

## Commands

| Command | Action |
|---------|--------|
| `npm run db:up` | Start Postgres container |
| `npm run db:down` | Stop containers |
| `npm run db:reset` | Destroy volume and re-seed from scratch |
| `npm run db:setup` | Start + health check + verify seed |

## psql shell

```bash
docker compose exec postgres psql -U ripple -d ripple
```

Example:

```sql
SELECT * FROM products WHERE sku = 'ACME-1847';
```
