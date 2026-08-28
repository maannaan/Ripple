#!/usr/bin/env python3
"""Lightweight test runner (no pytest required)."""
import importlib.util
import json
from pathlib import Path

SIM_DIR = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location(
    "simulate_change", SIM_DIR / "simulate_change.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

fixture = json.loads((SIM_DIR / "fixtures/scenario_a.json").read_text())
result = mod.simulate_change(fixture)

assert result["revenue_exposure"] == 21850.0
assert result["counts"]["purchase_orders"] == 2
assert result["details"]["purchase_order_ids"] == [101, 102]
assert mod.simulate_change(fixture) == result
print("OK: simulation tests passed")
