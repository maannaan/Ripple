/** Canonical Ripple domain types — ERP-agnostic contract for simulation and MCP tools. */

export type Product = {
  product_id: number;
  sku: string;
  name: string;
  supplier: string;
  status: string;
};

export type PurchaseOrder = {
  po_id: number;
  supplier: string;
  product_id: number;
  quantity: number;
  status: string;
};

export type Shipment = {
  shipment_id: number;
  po_id: number | null;
  product_id: number;
  quantity: number;
  status: string;
  needs_remapping?: boolean;
};

export type CustomerOrder = {
  order_id: number;
  product_id: number;
  quantity: number;
  status: string;
  region: string;
};

export type PricingRule = {
  rule_id: number;
  product_id: number;
  price: number;
  region: string;
};

export type SimulationInput = {
  old_sku: string;
  new_sku: string;
  product: Product;
  purchase_orders: PurchaseOrder[];
  shipments: Shipment[];
  customer_orders: CustomerOrder[];
  pricing_rules: PricingRule[];
};

export type SimulationOutput = {
  old_sku: string;
  new_sku: string;
  product_id: number;
  counts: Record<string, number>;
  quantities: Record<string, number>;
  revenue_exposure: number;
  details: {
    purchase_order_ids: number[];
    shipment_ids: number[];
    in_transit_shipment_ids: number[];
    customer_order_ids: number[];
    manual_review_order_ids: number[];
    pricing_rule_ids: number[];
  };
  safe_auto_updates: {
    product_sku: boolean;
    pricing_rules: number[];
    shipments: number[];
  };
  recommendations: string[];
};

export type ApplyPlan = {
  old_sku: string;
  new_sku: string;
  product_id: number;
  auto_steps: Array<{
    type: "product_sku" | "in_transit_shipment" | "pricing_rule";
    entity_id: number;
  }>;
  manual_review: Array<{
    type: "customer_order";
    entity_id: number;
    reason: string;
  }>;
};

export type RequestContext = {
  actor?: string;
  correlationId?: string;
  roles?: string[];
  idempotencyKey?: string;
  readOnly?: boolean;
};

export type ApplyResultSuccess = {
  success: true;
  audit_id: number;
  job_id?: number;
  old_sku: string;
  new_sku: string;
  product_id: number;
  shipment_ids_flagged: number[];
  customer_orders_skipped: number[];
};

export type ApplyResultFailure = {
  success: false;
  error: string;
};

export type ApplyResult = ApplyResultSuccess | ApplyResultFailure;

export type AuditLogEntry = {
  audit_id: number;
  action: string;
  old_sku: string;
  new_sku: string;
  product_id: number | null;
  actor: string | null;
  job_id: number | null;
  changes_json: Record<string, unknown>;
  created_at: string;
};

export type MigrationJobStatus =
  | "pending_approval"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "cancelled";

export type MigrationJob = {
  job_id: number;
  status: MigrationJobStatus;
  old_sku: string;
  new_sku: string;
  plan_json: ApplyPlan;
  simulation_json: SimulationOutput | null;
  created_by: string | null;
  approved_by: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
};

export type MigrationStep = {
  step_id: number;
  job_id: number;
  step_type: string;
  entity_id: string;
  status: "pending" | "completed" | "failed" | "skipped";
  external_id: string | null;
  error_message: string | null;
  created_at: string;
};

export type RippleRole = "analyst" | "approver" | "admin";
