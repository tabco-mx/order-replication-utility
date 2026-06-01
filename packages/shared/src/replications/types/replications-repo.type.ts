import type { ReplicationCounts } from "./replication-counts.type.js";
import type { ReplicationRow } from "./replication-row.type.js";
import type { UpsertReplication } from "./upsert-replication.type.js";

export interface ReplicationsRepo {
  upsertReplication: (row: UpsertReplication) => Promise<void>;
  listActive: () => Promise<ReplicationRow[]>;
  listRecent: (limit?: number) => Promise<ReplicationRow[]>;
  listFailed: (limit?: number) => Promise<ReplicationRow[]>;
  counts: () => Promise<ReplicationCounts>;
  clearReplications: () => Promise<void>;
}
