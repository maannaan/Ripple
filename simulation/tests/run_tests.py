#!/usr/bin/env python3
"""Lightweight test runner (no pytest required)."""
import importlib.util
import json
from pathlib import Path

SIM_DIR = Path(__file__).resolve().parent.parent
FIXTURES_DIR = SIM_DIR / "fixtures"

spec = importlib.util.spec_from_file_location(
    "simulate_change", SIM_DIR / "simulate_change.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

expectations = json.loads((FIXTURES_DIR / "expectations.json").read_text())

for name, expected in expectations.items():
    fixture_path = FIXTURES_DIR / f"{name}.json"
    if not fixture_path.exists():
        raise AssertionError(f"Missing fixture: {fixture_path}")

    fixture = json.loads(fixture_path.read_text())
    result = mod.simulate_change(fixture)

    assert result["revenue_exposure"] == expected["revenue_exposure"], (
        f"{name}: revenue_exposure expected {expected['revenue_exposure']}, "
        f"got {result['revenue_exposure']}"
    )
    assert result["counts"] == expected["counts"], (
        f"{name}: counts mismatch"
    )
    assert result["details"]["purchase_order_ids"] == expected["purchase_order_ids"], (
        f"{name}: purchase_order_ids mismatch"
    )
    assert (
        result["details"]["in_transit_shipment_ids"]
        == expected["in_transit_shipment_ids"]
    ), f"{name}: in_transit_shipment_ids mismatch"
    assert (
        result["safe_auto_updates"]["shipments"]
        == expected["safe_auto_updates_shipments"]
    ), f"{name}: safe_auto_updates shipments mismatch"
    assert mod.simulate_change(fixture) == result, f"{name}: not deterministic"

    print(f"OK: {name}")

print(f"OK: simulation tests passed ({len(expectations)} scenarios)")
