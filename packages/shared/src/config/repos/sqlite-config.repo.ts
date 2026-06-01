import type Database from "better-sqlite3";
import type { AppConfig } from "../types/app-config.type.js";
import { CONFIG_KEYS, type ConfigKey } from "../types/config-key.type.js";
import type { ConfigRepo } from "../types/config-repo.type.js";

const DEFAULTS: Record<ConfigKey, string> = {
  WANSOFT_BASE_URL: "",
  WANSOFT_USER_CODE: "",
  REMOTE_API_BASE_URL: "",
  REMOTE_API_TOKEN: "",
  REPLICATION_INTERVAL_MS: "30000",
};

export function createSqliteConfigRepo({ db }: { db: Database.Database }): ConfigRepo {
  function getConfigRaw(): Record<ConfigKey, string> {
    const rows = db.prepare("SELECT key, value FROM config").all() as {
      key: string;
      value: string;
    }[];
    const stored = new Map(rows.map((row) => [row.key, row.value]));
    const out = {} as Record<ConfigKey, string>;
    for (const key of CONFIG_KEYS) {
      out[key] = stored.get(key) ?? DEFAULTS[key];
    }
    return out;
  }

  return {
    async getConfig(): Promise<AppConfig> {
      const raw = getConfigRaw();

      const interval = Number(raw.REPLICATION_INTERVAL_MS);
      if (!Number.isFinite(interval) || interval <= 0) {
        throw new Error(
          `Invalid REPLICATION_INTERVAL_MS: expected a positive number, got "${raw.REPLICATION_INTERVAL_MS}"`,
        );
      }

      return {
        WANSOFT_BASE_URL: raw.WANSOFT_BASE_URL,
        WANSOFT_USER_CODE: raw.WANSOFT_USER_CODE,
        REMOTE_API_BASE_URL: raw.REMOTE_API_BASE_URL,
        REMOTE_API_TOKEN: raw.REMOTE_API_TOKEN,
        REPLICATION_INTERVAL_MS: interval,
      };
    },

    async setConfig(partial): Promise<void> {
      const stmt = db.prepare(
        "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      );
      const tx = db.transaction((entries: [string, string][]) => {
        for (const [key, value] of entries) stmt.run(key, value);
      });
      const entries = Object.entries(partial).filter(([key]) =>
        (CONFIG_KEYS as readonly string[]).includes(key),
      ) as [string, string][];
      tx(entries);
    },
  };
}
