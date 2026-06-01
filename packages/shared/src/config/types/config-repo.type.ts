import { ConfigUpdate } from "./config-update.type.js";
import { Config } from "./config.type.js";

export interface ConfigRepo {
  getOrCreateConfig: (data?: ConfigUpdate) => Promise<Config>;
  updateConfig: (data: ConfigUpdate) => Promise<void>;
}
