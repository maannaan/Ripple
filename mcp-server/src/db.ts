/** Backward-compatible DB exports — delegates to Postgres adapter. */
export { getPool, closePool } from "./db/pool.js";
export {
  getProductBySku,
  getProductById,
  findPurchaseOrders,
  findShipments,
  findCustomerOrders,
  findPricingRules,
  applyProductSkuUpdate,
  getAuditLog,
  getPostgresAdapter,
  type Product,
  type ApplyResult,
} from "./adapters/postgres-adapter.js";
