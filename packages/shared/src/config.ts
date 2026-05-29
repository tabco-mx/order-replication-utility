// Config persistence. Replaces the old .env: the config table is the source of truth.

import { openDb } from "./db.js";
import type { AppConfig } from "./types.js";

export const CONFIG_KEYS = [
  "WANSOFT_BASE_URL",
  "WANSOFT_USER_CODE",
  "REMOTE_API_BASE_URL",
  "REMOTE_API_TOKEN",
  "REPLICATION_INTERVAL_MS",
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];

const DEFAULTS: Record<ConfigKey, string> = {
  WANSOFT_BASE_URL: "http://localhost:80",
  WANSOFT_USER_CODE: "005",
  REMOTE_API_BASE_URL: "http://remote-server",
  REMOTE_API_TOKEN: "",
  REPLICATION_INTERVAL_MS: "30000",
};

// Raw key/value view of the config table, falling back to defaults for absent keys.
export function getConfigRaw(): Record<ConfigKey, string> {
  const db = openDb();
  const rows = db.prepare("SELECT key, value FROM config").all() as {
    key: string;
    value: string;
  }[];
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<ConfigKey, string>;
  for (const key of CONFIG_KEYS) {
    out[key] = stored.get(key) ?? DEFAULTS[key];
  }
  return out;
}

// Validated, typed config. Throws if a required value is missing or interval is invalid.
export function getConfig(): AppConfig {
  const raw = getConfigRaw();
  for (const key of CONFIG_KEYS) {
    if (key === "REPLICATION_INTERVAL_MS") continue;
    if (raw[key].trim() === "") {
      throw new Error(`Missing required config value: ${key}`);
    }
  }
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
}

// Upsert the provided config keys. Ignores unknown keys.
export function setConfig(partial: Partial<Record<ConfigKey, string>>): void {
  const db = openDb();
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
}
