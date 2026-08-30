import type { RippleDataSource } from "./types.js";
import { PostgresRippleDataSource } from "./postgres-adapter.js";
import { NetSuiteRippleDataSource } from "./netsuite/netsuite-adapter.js";
import {
  loadRippleConfig,
  loadStatusMapping,
  type RippleConfig,
} from "../config/load-config.js";

let cachedDataSource: RippleDataSource | null = null;

export function createDataSource(config?: RippleConfig): RippleDataSource {
  const cfg = config ?? loadRippleConfig();

  if (cfg.dataSource === "netsuite") {
    const statusMap = loadStatusMapping(cfg);
    return new NetSuiteRippleDataSource({
      accountId: cfg.netsuite?.accountId ?? process.env.NETSUITE_ACCOUNT_ID ?? "",
      roleId: cfg.netsuite?.roleId ?? process.env.NETSUITE_ROLE_ID,
      baseUrl: cfg.netsuite?.baseUrl ?? process.env.NETSUITE_BASE_URL,
      fixtureDir:
        cfg.netsuite?.fixtureDir ?? process.env.NETSUITE_FIXTURE_DIR,
      statusMapping: statusMap,
      readOnly: cfg.readOnly ?? process.env.RIPPLE_READ_ONLY === "true",
    });
  }

  return new PostgresRippleDataSource();
}

export function getDataSource(): RippleDataSource {
  if (!cachedDataSource) {
    cachedDataSource = createDataSource();
  }
  return cachedDataSource;
}

export function resetDataSource(): void {
  cachedDataSource = null;
}
