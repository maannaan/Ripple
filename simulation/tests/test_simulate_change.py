import json
from pathlib import Path

import pytest

from simulate_change import simulate_change

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / f"{name}.json").open(encoding="utf-8") as f:
        return json.load(f)


def test_scenario_a_counts_and_revenue():
    data = load_fixture("scenario_a")
    result = simulate_change(data)

    assert result["old_sku"] == "ACME-1847"
    assert result["new_sku"] == "ACME-2847"
    assert result["product_id"] == 1
    assert result["counts"] == {
        "purchase_orders": 2,
        "shipments": 2,
        "customer_orders": 2,
        "pricing_rules": 2,
    }
    assert result["quantities"] == {
        "purchase_order_units": 150,
        "shipment_units": 80,
        "customer_order_units": 25,
    }
    assert result["revenue_exposure"] == 21850.0
    assert result["details"]["purchase_order_ids"] == [101, 102]
    assert result["details"]["shipment_ids"] == [5001, 5002]
    assert result["details"]["in_transit_shipment_ids"] == [5002]
    assert result["details"]["customer_order_ids"] == [9001, 9002]
    assert result["details"]["pricing_rule_ids"] == [1, 2]
    assert result["safe_auto_updates"]["shipments"] == [5002]


def test_scenario_a_deterministic():
    data = load_fixture("scenario_a")
    a = simulate_change(data)
    b = simulate_change(data)
    assert a == b


def test_invalid_sku_raises():
    data = load_fixture("scenario_a")
    data["product"]["sku"] = "WRONG"
    with pytest.raises(ValueError, match="does not match"):
        simulate_change(data)
