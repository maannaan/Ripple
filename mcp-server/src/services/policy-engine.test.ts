import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PolicyEngine } from "../services/policy-engine.js";
import type { ApplyPlan, SimulationOutput } from "../domain/types.js";

const simulation: SimulationOutput = {
  old_sku: "ACME-1847",
  new_sku: "ACME-2847",
  product_id: 1,
  counts: {},
  quantities: {},
  revenue_exposure: 21850,
  details: {
    purchase_order_ids: [101, 102],
    shipment_ids: [5001, 5002],
    in_transit_shipment_ids: [5002],
    customer_order_ids: [9001, 9002],
    manual_review_order_ids: [9001, 9002],
    pricing_rule_ids: [1, 2],
  },
  safe_auto_updates: {
    product_sku: true,
    pricing_rules: [1, 2],
    shipments: [5002],
  },
  recommendations: [],
};

const plan: ApplyPlan = {
  old_sku: "ACME-1847",
  new_sku: "ACME-2847",
  product_id: 1,
  auto_steps: [
    { type: "product_sku", entity_id: 1 },
    { type: "in_transit_shipment", entity_id: 5002 },
  ],
  manual_review: [],
};

describe("PolicyEngine", () => {
  it("allows scenario A revenue under VP threshold", () => {
    const engine = new PolicyEngine({
      auto_apply: ["product_sku", "in_transit_shipments"],
      always_manual: ["customer_orders"],
      max_revenue_exposure_without_vp: 50000,
      blocked_regions: [],
    });
    const result = engine.evaluate(simulation, plan, ["analyst"]);
    assert.equal(result.allowed, true);
    assert.equal(result.blockedReasons.length, 0);
  });

  it("blocks high exposure without approver", () => {
    const engine = new PolicyEngine({
      auto_apply: ["product_sku"],
      always_manual: ["customer_orders"],
      max_revenue_exposure_without_vp: 10000,
      blocked_regions: [],
    });
    const highExposure = { ...simulation, revenue_exposure: 25000 };
    const result = engine.evaluate(highExposure, plan, ["analyst"]);
    assert.ok(result.blockedReasons.length > 0);
  });
});
