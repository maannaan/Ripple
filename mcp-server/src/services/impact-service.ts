import type {
  ApplyPlan,
  Product,
  RequestContext,
  SimulationInput,
  SimulationOutput,
} from "../domain/types.js";
import type { RippleDataSource } from "../adapters/types.js";
import { getDataSource } from "../adapters/factory.js";

export class ImpactService {
  constructor(private readonly dataSource: RippleDataSource = getDataSource()) {}

  async healthCheck() {
    return this.dataSource.healthCheck();
  }

  async getProduct(query: { sku?: string; product_id?: number }) {
    return this.dataSource.getProduct({
      sku: query.sku,
      productId: query.product_id,
    });
  }

  async findPurchaseOrders(productId: number) {
    return this.dataSource.findPurchaseOrders(productId);
  }

  async findShipments(productId: number) {
    return this.dataSource.findShipments(productId);
  }

  async findCustomerOrders(productId: number) {
    return this.dataSource.findCustomerOrders(productId);
  }

  async findPricingRules(productId: number) {
    return this.dataSource.findPricingRules(productId);
  }

  async gatherImpactData(oldSku: string, newSku: string): Promise<SimulationInput | null> {
    const product = await this.dataSource.getProduct({ sku: oldSku });
    if (!product) return null;

    const productId = product.product_id;
    const [purchase_orders, shipments, customer_orders, pricing_rules] =
      await Promise.all([
        this.dataSource.findPurchaseOrders(productId),
        this.dataSource.findShipments(productId),
        this.dataSource.findCustomerOrders(productId),
        this.dataSource.findPricingRules(productId),
      ]);

    return {
      old_sku: oldSku,
      new_sku: newSku,
      product,
      purchase_orders,
      shipments,
      customer_orders,
      pricing_rules,
    };
  }

  buildApplyPlan(
    simulation: SimulationOutput,
    product: Product,
  ): ApplyPlan {
    const auto_steps: ApplyPlan["auto_steps"] = [];

    if (simulation.safe_auto_updates.product_sku) {
      auto_steps.push({ type: "product_sku", entity_id: product.product_id });
    }

    for (const shipmentId of simulation.safe_auto_updates.shipments) {
      auto_steps.push({ type: "in_transit_shipment", entity_id: shipmentId });
    }

    for (const ruleId of simulation.safe_auto_updates.pricing_rules) {
      auto_steps.push({ type: "pricing_rule", entity_id: ruleId });
    }

    const manual_review = simulation.details.manual_review_order_ids.map(
      (orderId) => ({
        type: "customer_order" as const,
        entity_id: orderId,
        reason: "Customer orders require manual review per policy",
      }),
    );

    return {
      old_sku: simulation.old_sku,
      new_sku: simulation.new_sku,
      product_id: product.product_id,
      auto_steps,
      manual_review,
    };
  }

  async applyProductUpdate(
    oldSku: string,
    newSku: string,
    ctx: RequestContext,
  ) {
    const product = await this.dataSource.getProduct({ sku: oldSku });
    if (!product) {
      return { success: false as const, error: `Product not found for SKU ${oldSku}` };
    }

    const plan: ApplyPlan = {
      old_sku: oldSku,
      new_sku: newSku,
      product_id: product.product_id,
      auto_steps: [],
      manual_review: [],
    };

    return this.dataSource.applySkuMigration(plan, ctx);
  }

  async getAuditLog(options: { audit_id?: number; limit?: number }) {
    return this.dataSource.getAuditLog(options);
  }

  get dataSourceName(): string {
    return this.dataSource.name;
  }
}
