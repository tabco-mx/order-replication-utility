import { ReplicationStatus } from "./order-replication-status.type.js";

export interface Replication {
  order_number: number;
  operation_date: string;
  status: ReplicationStatus;
  action: string | null;
  remote_id: string | null;
  error: string | null;
  updated_at: number;
}
