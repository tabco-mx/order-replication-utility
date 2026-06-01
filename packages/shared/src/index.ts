// Public surface of @app/shared.

export * from "./types.js";
export { openDb } from "./helpers/open-db.js";

export { createSqliteConfigRepo } from "./config/repos/sqlite-config.repo.js";
export type { AppConfig } from "./config/types/app-config.type.js";
export { CONFIG_KEYS, type ConfigKey } from "./config/types/config-key.type.js";
export type { ConfigRepo } from "./config/types/config-repo.type.js";

export { createSqliteLogsRepo } from "./logs/repos/sqlite-logs.repo.js";
export type { LogLevel } from "./logs/types/log-level.type.js";
export type { LogRow } from "./logs/types/log-row.type.js";
export type { LogsRepo } from "./logs/types/logs-repo.type.js";
export type { NewLog } from "./logs/types/new-log.type.js";

export { createSqliteReplicationsRepo } from "./replications/repos/sqlite-replications.repo.js";
export type { ReplicationCounts } from "./replications/types/replication-counts.type.js";
export type { ReplicationRow } from "./replications/types/replication-row.type.js";
export type { ReplicationStatus } from "./replications/types/replication-status.type.js";
export type { ReplicationsRepo } from "./replications/types/replications-repo.type.js";
export type { UpsertReplication } from "./replications/types/upsert-replication.type.js";

export { createSqliteWorkerStateRepo } from "./worker-state/repos/sqlite-worker-state.repo.js";
export type { UpdateHeartbeat } from "./worker-state/types/update-heartbeat.type.js";
export type { WorkerStateRepo } from "./worker-state/types/worker-state-repo.type.js";
export type { WorkerState } from "./worker-state/types/worker-state.type.js";
