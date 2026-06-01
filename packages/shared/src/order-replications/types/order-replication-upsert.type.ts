import type { ReplicationStatus } from "./order-replication-status.type.js";

export interface ReplicationUpsert {
  order_number: number;
  operation_date: string;
  status: ReplicationStatus;
  action?: string | null;
  remote_id?: string | null;
  error?: string | null;
}
