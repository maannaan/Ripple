# ERP connectors

Ripple uses a **RippleDataSource** adapter interface. Simulation stays ERP-agnostic; adapters map ERP records to canonical JSON.

## Supported adapters

| Adapter | Status | Config |
|---------|--------|--------|
| **postgres** | Default (demo + self-hosted cache) | `RIPPLE_DATA_SOURCE=postgres` |
| **netsuite** | Fixture replay + live REST skeleton | `RIPPLE_DATA_SOURCE=netsuite` |

## Postgres (default)

Uses operational tables in [`db/schema.sql`](../db/schema.sql). Suitable for:

- Hackathon demo
- Self-hosted pilot with your own Postgres operational DB
- Local cache when ERP is read-only

## NetSuite

### Fixture replay (CI / contract tests)

```bash
export RIPPLE_DATA_SOURCE=netsuite
export NETSUITE_FIXTURE_DIR=mcp-server/src/adapters/netsuite/fixtures
npm run test --workspace=mcp-server
```

Fixtures mirror Scenario A golden numbers (revenue **21850**, shipment **5002** in transit).

### Live SuiteTalk REST

In `config/ripple.config.yaml`:

```yaml
dataSource: netsuite
readOnly: true   # recommended until OAuth wired

netsuite:
  accountId: "1234567"
  roleId: "3"
  baseUrl: "https://1234567.suitetalk.api.netsuite.com"
  credentialsSecret: vault://ripple/netsuite
```

Map ERP statuses in [`config/erp-status-map.yaml`](../config/erp-status-map.yaml).

### Tool mapping

| Ripple MCP tool | NetSuite record |
|-----------------|-----------------|
| `get_product` | Inventory item |
| `find_purchase_orders` | Purchase order lines |
| `find_shipments` | Item fulfillment / transfer |
| `find_customer_orders` | Sales orders |
| `find_pricing_rules` | Price levels |

Live write path uses **migration jobs** (`create_migration_job` → `approve_migration_job` → `execute_migration_job`).

## Adding a connector

1. Implement `RippleDataSource` in `mcp-server/src/adapters/<erp>/`
2. Add status mapping YAML
3. Add fixture replay + contract tests
4. Register in [`mcp-server/src/adapters/factory.ts`](../mcp-server/src/adapters/factory.ts)
5. Document in this file

## Read-only mode

Set `RIPPLE_READ_ONLY=true` to run impact analysis against production ERP without writes. All `apply_*` and `execute_migration_job` calls are rejected.
