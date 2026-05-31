// Server-only data access. Re-exports the @app/shared read functions used by pages.
// The "server-only" import guarantees this module never ends up in a client bundle.
import "server-only";

export {
  getWorkerState,
  counts,
  dbSizeBytes,
  listActive,
  listRecent,
  listLogs,
  countLogs,
  getConfig,
  CONFIG_KEYS,
} from "@app/shared";

export type {
  WorkerState,
  ReplicationRow,
  LogRow,
  ConfigKey,
} from "@app/shared";
