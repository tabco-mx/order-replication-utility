// Public surface of @app/shared.

export * from "./types.js";
export * from "./paths.js";
export { openDb } from "./db.js";
export {
  CONFIG_KEYS,
  type ConfigKey,
  getConfig,
  getConfigRaw,
  setConfig,
} from "./config.js";
export {
  type NewLog,
  insertLog,
  listLogs,
  countLogs,
  clearLogs,
  dbSizeBytes,
} from "./logs.js";
export {
  type UpsertReplication,
  upsertReplication,
  listActive,
  listRecent,
  listFailed,
  counts,
  clearReplications,
} from "./replications.js";
export {
  getWorkerState,
  updateHeartbeat,
  requestRestart,
  consumeRestartFlag,
  clearAll,
} from "./worker-state.js";
