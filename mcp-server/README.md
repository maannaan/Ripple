# Ripple MCP Server

MCP tools over Streamable HTTP for Ripple's Docker Postgres database.

## Tools

| Tool | Description |
|------|-------------|
| `get_product` | By `sku` or `product_id` |
| `find_purchase_orders` | By `product_id` |
| `find_shipments` | By `product_id` |
| `find_customer_orders` | By `product_id` |
| `find_pricing_rules` | By `product_id` |
| `apply_product_update` | Safe SKU migration + in-transit shipment flags (requires approval) |
| `get_audit_log` | By `audit_id` or recent `limit` |

## Run

Requires Postgres (`npm run db:setup`) and `DATABASE_URL` in `.env`.

```bash
npm run dev
```

Endpoints:

- MCP: http://localhost:3100/mcp
- Health: http://localhost:3100/health

Register in TrueForge:

```bash
npm run mcp:register
```
