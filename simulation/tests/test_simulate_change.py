import json
from pathlib import Path

import pytest

from simulate_change import simulate_change

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"


def load_fixture(name: str) -> dict:
    with (FIXTURES / f"{name}.json").open(encoding="utf-8") as f:
        return json.load(f)


def load_expectations() -> dict:
    with (FIXTURES / "expectations.json").open(encoding="utf-8") as f:
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


def test_scenario_b_no_in_transit():
    data = load_fixture("scenario_b")
    result = simulate_change(data)

    assert result["old_sku"] == "BETA-9001"
    assert result["new_sku"] == "BETA-9002"
    assert result["product_id"] == 2
    assert result["revenue_exposure"] == 7500.0
    assert result["details"]["purchase_order_ids"] == [103]
    assert result["details"]["in_transit_shipment_ids"] == []
    assert result["safe_auto_updates"]["shipments"] == []


def test_scenario_c_no_open_orders():
    data = load_fixture("scenario_c")
    result = simulate_change(data)

    assert result["revenue_exposure"] == 0.0
    assert result["counts"]["purchase_orders"] == 2
    assert result["counts"]["customer_orders"] == 2
    assert result["details"]["in_transit_shipment_ids"] == [5002]


@pytest.mark.parametrize("name", ["scenario_a", "scenario_b", "scenario_c"])
def test_all_fixtures_match_expectations(name: str):
    expected = load_expectations()[name]
    result = simulate_change(load_fixture(name))

    assert result["revenue_exposure"] == expected["revenue_exposure"]
    assert result["counts"] == expected["counts"]
    assert result["details"]["purchase_order_ids"] == expected["purchase_order_ids"]
    assert (
        result["details"]["in_transit_shipment_ids"]
        == expected["in_transit_shipment_ids"]
    )
    assert (
        result["safe_auto_updates"]["shipments"]
        == expected["safe_auto_updates_shipments"]
    )


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
