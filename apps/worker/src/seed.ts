// One-time setup: import config from a root .env (if present) into the config table,
// so upgrading from the old .env-based version loses nothing. Safe to run repeatedly.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { repoRoot, setConfig, getConfig, CONFIG_KEYS, type ConfigKey } from "@app/shared";

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const known = new Set<string>(CONFIG_KEYS);
let imported: Partial<Record<ConfigKey, string>> = {};

try {
  const env = parseEnv(readFileSync(resolve(repoRoot, ".env"), "utf8"));
  for (const [key, value] of Object.entries(env)) {
    if (known.has(key)) imported[key as ConfigKey] = value;
  }
} catch {
  console.log("No root .env found — seeding defaults only.");
}

setConfig(imported);
console.log("Config seeded. Current values:");
console.log(getConfig());
