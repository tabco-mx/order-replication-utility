// Server-only data access. Re-exports the @app/shared read functions used by pages.
// The "server-only" import guarantees this module never ends up in a client bundle.
import "server-only";

import {
  openDb,
  createSqliteLogsRepo,
  createSqliteReplicationsRepo,
  createSqliteWorkerStateRepo,
  createSqliteConfigRepo,
} from "@app/shared";

export { CONFIG_KEYS } from "@app/shared";

const db = openDb();
export const configRepo = createSqliteConfigRepo({ db });
export const logsRepo = createSqliteLogsRepo({ db });
export const replicationsRepo = createSqliteReplicationsRepo({ db });
export const workerStateRepo = createSqliteWorkerStateRepo({
  db,
  logsRepo,
  replicationsRepo,
});

export type {
  WorkerState,
  ReplicationRow,
  LogRow,
  ConfigKey,
} from "@app/shared";
