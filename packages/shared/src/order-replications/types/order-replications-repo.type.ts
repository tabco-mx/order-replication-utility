import type { ReplicationCounts } from "./order-replication-counts.type.js";
import type { Replication } from "./order-replication.type.js";
import type { ReplicationUpsert } from "./order-replication-upsert.type.js";

export interface ReplicationsRepo {
  upsertReplication: (data: ReplicationUpsert) => Promise<void>;
  listActive: () => Promise<Replication[]>;
  listRecent: (limit?: number) => Promise<Replication[]>;
  listFailed: (limit?: number) => Promise<Replication[]>;
  counts: () => Promise<ReplicationCounts>;
  clearReplications: () => Promise<void>;
}
