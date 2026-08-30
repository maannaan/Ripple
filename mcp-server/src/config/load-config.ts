import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { RippleRole } from "../domain/types.js";

export type RippleConfig = {
  dataSource: "postgres" | "netsuite";
  readOnly?: boolean;
  postgres?: {
    connectionString?: string;
  };
  netsuite?: {
    accountId?: string;
    roleId?: string;
    baseUrl?: string;
    fixtureDir?: string;
    credentialsSecret?: string;
  };
  statusMapping?: string;
  policies?: string;
  oidc?: {
    issuer?: string;
    audience?: string;
    jwksUri?: string;
  };
  auditExport?: {
    webhookUrl?: string;
    s3Bucket?: string;
  };
};

export type ApiKeyConfig = {
  key: string;
  roles: RippleRole[];
  label?: string;
};

export type StatusMapping = Record<string, string>;

export type PolicyConfig = {
  auto_apply: string[];
  always_manual: string[];
  max_revenue_exposure_without_vp?: number;
  blocked_regions?: string[];
};

const DEFAULT_CONFIG: RippleConfig = {
  dataSource: "postgres",
  readOnly: false,
};

let cachedConfig: RippleConfig | null = null;

export function loadRippleConfig(configPath?: string): RippleConfig {
  if (cachedConfig) return cachedConfig;

  const path =
    configPath ??
    process.env.RIPPLE_CONFIG ??
    resolve(process.cwd(), "config/ripple.config.yaml");

  if (!existsSync(path)) {
    cachedConfig = {
      ...DEFAULT_CONFIG,
      dataSource:
        (process.env.RIPPLE_DATA_SOURCE as RippleConfig["dataSource"]) ??
        "postgres",
      readOnly: process.env.RIPPLE_READ_ONLY === "true",
    };
    return cachedConfig;
  }

  const raw = parseYaml(readFileSync(path, "utf-8")) as RippleConfig;
  cachedConfig = { ...DEFAULT_CONFIG, ...raw };
  return cachedConfig;
}

export function loadStatusMapping(config: RippleConfig): StatusMapping {
  const path =
    config.statusMapping ??
    process.env.RIPPLE_STATUS_MAP ??
    resolve(process.cwd(), "config/erp-status-map.yaml");

  if (!existsSync(path)) {
    return {
      "Pending Fulfillment": "pending",
      "In Transit": "transit",
      "Shipped": "delivered",
      Processing: "processing",
      Pending: "pending",
      Backorder: "backorder",
    };
  }

  return parseYaml(readFileSync(path, "utf-8")) as StatusMapping;
}

export function loadPolicyConfig(config: RippleConfig): PolicyConfig {
  const path =
    config.policies ??
    process.env.RIPPLE_POLICIES ??
    resolve(process.cwd(), "config/policies.yaml");

  if (!existsSync(path)) {
    return {
      auto_apply: ["product_sku", "in_transit_shipments"],
      always_manual: ["customer_orders"],
      max_revenue_exposure_without_vp: 50000,
      blocked_regions: [],
    };
  }

  return parseYaml(readFileSync(path, "utf-8")) as PolicyConfig;
}

export function loadApiKeys(): ApiKeyConfig[] {
  const raw = process.env.MCP_API_KEYS ?? "";
  if (!raw.trim()) return [];

  return raw.split(",").map((entry) => {
    const [key, rolesPart, label] = entry.split(":");
    const roles = (rolesPart ?? "analyst,approver")
      .split("+")
      .filter(Boolean) as RippleRole[];
    return { key: key.trim(), roles, label: label?.trim() };
  });
}

export function resetConfigCache(): void {
  cachedConfig = null;
}
