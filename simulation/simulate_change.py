#!/usr/bin/env python3
"""Deterministic SKU change impact simulation. JSON input only — no database access."""

from __future__ import annotations

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any

OPEN_ORDER_STATUSES = frozenset({"processing", "pending", "backorder"})
IN_TRANSIT_STATUS = "transit"


def simulate_change(data: dict[str, Any]) -> dict[str, Any]:
    old_sku = data.get("old_sku")
    new_sku = data.get("new_sku")
    product = data.get("product") or {}
    purchase_orders = data.get("purchase_orders") or []
    shipments = data.get("shipments") or []
    customer_orders = data.get("customer_orders") or []
    pricing_rules = data.get("pricing_rules") or []

    if not old_sku or not new_sku:
        raise ValueError("old_sku and new_sku are required")
    if not product:
        raise ValueError("product is required")
    if product.get("sku") != old_sku:
        raise ValueError(
            f"product.sku ({product.get('sku')}) does not match old_sku ({old_sku})"
        )

    product_id = product.get("product_id")
    po_ids = [int(r["po_id"]) for r in purchase_orders]
    shipment_ids = [int(r["shipment_id"]) for r in shipments]
    in_transit = [
        int(r["shipment_id"])
        for r in shipments
        if (r.get("status") or "").lower() == IN_TRANSIT_STATUS
    ]
    order_ids = [int(r["order_id"]) for r in customer_orders]
    pricing_ids = [int(r["rule_id"]) for r in pricing_rules]

    po_units = sum(int(r.get("quantity", 0)) for r in purchase_orders)
    shipment_units = sum(int(r.get("quantity", 0)) for r in shipments)
    order_units = sum(int(r.get("quantity", 0)) for r in customer_orders)

    price_by_region: dict[str, Decimal] = {}
    for rule in pricing_rules:
        price_by_region[str(rule["region"])] = Decimal(str(rule["price"]))

    revenue = Decimal(0)
    for order in customer_orders:
        status = (order.get("status") or "").lower()
        if status not in OPEN_ORDER_STATUSES:
            continue
        region = str(order.get("region", ""))
        qty = int(order.get("quantity", 0))
        price = price_by_region.get(region)
        if price is not None:
            revenue += price * qty

    manual_review = list(order_ids)
    recommendations: list[str] = []
    if manual_review:
        recommendations.append(
            f"Manual review: customer orders {', '.join(map(str, manual_review))} ({order_units} units)"
        )
    if in_transit:
        recommendations.append(
            f"Remap in-transit shipments: {', '.join(map(str, in_transit))}"
        )

    return {
        "old_sku": old_sku,
        "new_sku": new_sku,
        "product_id": product_id,
        "counts": {
            "purchase_orders": len(purchase_orders),
            "shipments": len(shipments),
            "customer_orders": len(customer_orders),
            "pricing_rules": len(pricing_rules),
        },
        "quantities": {
            "purchase_order_units": po_units,
            "shipment_units": shipment_units,
            "customer_order_units": order_units,
        },
        "revenue_exposure": float(revenue),
        "details": {
            "purchase_order_ids": po_ids,
            "shipment_ids": shipment_ids,
            "in_transit_shipment_ids": in_transit,
            "customer_order_ids": order_ids,
            "manual_review_order_ids": manual_review,
            "pricing_rule_ids": pricing_ids,
        },
        "safe_auto_updates": {
            "product_sku": True,
            "pricing_rules": pricing_ids,
            "shipments": in_transit,
        },
        "recommendations": recommendations,
    }


def load_input(args: argparse.Namespace) -> dict[str, Any]:
    if args.fixture:
        fixture_path = Path(__file__).parent / "fixtures" / f"{args.fixture}.json"
        with fixture_path.open(encoding="utf-8") as f:
            return json.load(f)
    if args.input:
        with open(args.input, encoding="utf-8") as f:
            return json.load(f)
    return json.load(sys.stdin)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ripple change-impact simulation")
    parser.add_argument("--input", help="Path to input JSON file")
    parser.add_argument(
        "--fixture",
        help="Fixture name under simulation/fixtures/ (e.g. scenario_a)",
    )
    args = parser.parse_args()

    try:
        data = load_input(args)
        result = simulate_change(data)
    except (ValueError, json.JSONDecodeError, OSError) as exc:
        json.dump({"error": str(exc)}, sys.stdout)
        sys.stdout.write("\n")
        sys.exit(1)

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
