import type { ReplicationStatus } from "./replication-status.type.js";

export interface UpsertReplication {
  order_number: number;
  operation_date: string;
  status: ReplicationStatus;
  action?: string | null;
  remote_id?: string | null;
  error?: string | null;
}
