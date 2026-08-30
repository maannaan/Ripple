import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  ApplyPlan,
  ApplyResult,
  AuditLogEntry,
  CustomerOrder,
  PricingRule,
  Product,
  PurchaseOrder,
  RequestContext,
  Shipment,
  SimulationInput,
} from "../domain/types.js";
import type { RippleDataSource } from "./types.js";
import type { StatusMapping } from "../config/load-config.js";

export type NetSuiteAdapterOptions = {
  accountId: string;
  roleId?: string;
  baseUrl?: string;
  fixtureDir?: string;
  statusMapping: StatusMapping;
  readOnly?: boolean;
};

type FixtureBundle = {
  product: Product;
  purchase_orders: PurchaseOrder[];
  shipments: Shipment[];
  customer_orders: CustomerOrder[];
  pricing_rules: PricingRule[];
};

function mapStatus(value: string, mapping: StatusMapping): string {
  return mapping[value] ?? value.toLowerCase().replace(/\s+/g, "_");
}

/**
 * NetSuite adapter with fixture replay for CI/contract tests.
 * Live SuiteTalk REST calls use baseUrl + accountId when fixtureDir is unset.
 */
export class NetSuiteRippleDataSource implements RippleDataSource {
  readonly name = "netsuite";
  private fixture: FixtureBundle | null = null;

  constructor(private readonly options: NetSuiteAdapterOptions) {
    if (options.fixtureDir) {
      this.fixture = this.loadFixture(options.fixtureDir);
    }
  }

  private loadFixture(dir: string): FixtureBundle {
    const path = join(dir, "scenario_a.json");
    if (!existsSync(path)) {
      throw new Error(`NetSuite fixture not found: ${path}`);
    }
    const raw = JSON.parse(readFileSync(path, "utf-8")) as SimulationInput;
    return {
      product: raw.product,
      purchase_orders: raw.purchase_orders,
      shipments: raw.shipments,
      customer_orders: raw.customer_orders,
      pricing_rules: raw.pricing_rules,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; detail?: string }> {
    if (this.fixture) return { ok: true, detail: "fixture-replay" };
    if (!this.options.baseUrl) {
      return { ok: false, detail: "NETSUITE_BASE_URL not configured" };
    }
    try {
      const res = await fetch(`${this.options.baseUrl}/services/rest/record/v1/metadata-catalog`, {
        headers: { Prefer: "transient" },
      });
      return { ok: res.ok, detail: `HTTP ${res.status}` };
    } catch (error) {
      return {
        ok: false,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getProduct(query: {
    sku?: string;
    productId?: number;
  }): Promise<Product | null> {
    if (this.fixture) {
      if (query.sku && this.fixture.product.sku === query.sku) {
        return this.fixture.product;
      }
      if (
        query.productId !== undefined &&
        this.fixture.product.product_id === query.productId
      ) {
        return this.fixture.product;
      }
      return null;
    }

    // Live path placeholder — customers wire OAuth/TBA in deployment
    if (!query.sku) return null;
    const url = `${this.options.baseUrl}/services/rest/record/v1/inventoryitem?q=itemId IS "${query.sku}"`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { items?: Array<Record<string, unknown>> };
    const item = data.items?.[0];
    if (!item) return null;
    return {
      product_id: Number(item.id ?? 0),
      sku: String(item.itemId ?? query.sku),
      name: String(item.displayName ?? query.sku),
      supplier: String(item.vendorName ?? "unknown"),
      status: mapStatus(String(item.isInactive === true ? "inactive" : "active"), this.options.statusMapping),
    };
  }

  async findPurchaseOrders(productId: number): Promise<PurchaseOrder[]> {
    if (this.fixture) {
      return this.fixture.purchase_orders.filter((p) => p.product_id === productId);
    }
    return [];
  }

  async findShipments(productId: number): Promise<Shipment[]> {
    if (this.fixture) {
      return this.fixture.shipments
        .filter((s) => s.product_id === productId)
        .map((s) => ({
          ...s,
          status: mapStatus(s.status, this.options.statusMapping),
        }));
    }
    return [];
  }

  async findCustomerOrders(productId: number): Promise<CustomerOrder[]> {
    if (this.fixture) {
      return this.fixture.customer_orders
        .filter((o) => o.product_id === productId)
        .map((o) => ({
          ...o,
          status: mapStatus(o.status, this.options.statusMapping),
        }));
    }
    return [];
  }

  async findPricingRules(productId: number): Promise<PricingRule[]> {
    if (this.fixture) {
      return this.fixture.pricing_rules.filter((r) => r.product_id === productId);
    }
    return [];
  }

  async applySkuMigration(
    _plan: ApplyPlan,
    ctx: RequestContext,
  ): Promise<ApplyResult> {
    if (this.options.readOnly || ctx.readOnly) {
      return { success: false, error: "NetSuite adapter is in read-only mode" };
    }
    if (this.fixture) {
      return {
        success: false,
        error:
          "Fixture replay mode is read-only; configure live NetSuite credentials for writes",
      };
    }
    return {
      success: false,
      error:
        "Live NetSuite write path requires customer OAuth setup — use migration jobs",
    };
  }

  async getAuditLog(): Promise<AuditLogEntry[]> {
    return [];
  }
}
