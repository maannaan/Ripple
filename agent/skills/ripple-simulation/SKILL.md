# Ripple simulation skill

Run deterministic change-impact simulation after MCP data fetch. Never estimate counts or revenue in prose.

## When to use

User proposes a product SKU change (old SKU → new SKU).

## Steps

1. Call MCP tools: `get_product` (old SKU), then `find_purchase_orders`, `find_shipments`, `find_customer_orders`, `find_pricing_rules` with the returned `product_id`.
2. Build JSON input:

```json
{
  "old_sku": "<old>",
  "new_sku": "<new>",
  "product": { ... from get_product ... },
  "purchase_orders": [ ... ],
  "shipments": [ ... ],
  "customer_orders": [ ... ],
  "pricing_rules": [ ... ]
}
```

3. In the sandbox, write this JSON to `input.json`.
4. Run: `python simulate_change.py --input input.json`
5. Parse stdout JSON. Use **only** those numbers in the Impact Report.
6. If the script errors or sandbox fails, stop and report the error — do not guess.

## Files in this skill

- `simulate_change.py` — deterministic simulation (no database access)
