import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NetSuiteRippleDataSource } from "./netsuite-adapter.js";

const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

describe("NetSuiteRippleDataSource contract", () => {
  const adapter = new NetSuiteRippleDataSource({
    accountId: "test",
    fixtureDir: FIXTURE_DIR,
    statusMapping: { transit: "transit", processing: "processing" },
    readOnly: true,
  });

  it("loads product by SKU from fixture replay", async () => {
    const product = await adapter.getProduct({ sku: "ACME-1847" });
    assert.ok(product);
    assert.equal(product!.product_id, 1);
    assert.equal(product!.sku, "ACME-1847");
  });

  it("returns purchase orders and shipments for product", async () => {
    const pos = await adapter.findPurchaseOrders(1);
    assert.equal(pos.length, 2);
    assert.deepEqual(
      pos.map((p) => p.po_id),
      [101, 102],
    );

    const shipments = await adapter.findShipments(1);
    const inTransit = shipments.filter((s) => s.status === "transit");
    assert.equal(inTransit.length, 1);
    assert.equal(inTransit[0].shipment_id, 5002);
  });

  it("rejects writes in fixture read-only mode", async () => {
    const result = await adapter.applySkuMigration(
      {
        old_sku: "ACME-1847",
        new_sku: "ACME-2847",
        product_id: 1,
        auto_steps: [],
        manual_review: [],
      },
      { readOnly: true },
    );
    assert.equal(result.success, false);
  });
});
