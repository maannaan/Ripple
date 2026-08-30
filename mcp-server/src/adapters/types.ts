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
} from "../domain/types.js";

export interface RippleDataSource {
  readonly name: string;

  healthCheck(): Promise<{ ok: boolean; detail?: string }>;

  getProduct(query: {
    sku?: string;
    productId?: number;
  }): Promise<Product | null>;

  findPurchaseOrders(productId: number): Promise<PurchaseOrder[]>;
  findShipments(productId: number): Promise<Shipment[]>;
  findCustomerOrders(productId: number): Promise<CustomerOrder[]>;
  findPricingRules(productId: number): Promise<PricingRule[]>;

  applySkuMigration(
    plan: ApplyPlan,
    ctx: RequestContext,
  ): Promise<ApplyResult>;

  getAuditLog(options: {
    audit_id?: number;
    limit?: number;
  }): Promise<AuditLogEntry[]>;
}
