import type { AppConfig } from "./app-config.type.js";
import type { ConfigKey } from "./config-key.type.js";

export interface ConfigRepo {
  getConfig: () => Promise<AppConfig>;
  setConfig: (partial: Partial<Record<ConfigKey, string>>) => Promise<void>;
}
