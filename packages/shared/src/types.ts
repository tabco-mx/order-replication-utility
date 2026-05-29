// Shared domain + persistence types used by both the worker and the UI.

export interface Order {
  OperationDate: string;
  OrderNumber: number;
  OpenedDate: string;
  TableNumber: string;
  Discount: number;
  Subtotal: number;
  IVA: number;
  IEPS: number;
  Total: number;
}

export interface OrderItem {
  ConsecutiveId: number;
  DishId: number;
  Quantity: number;
  Description: string;
  Total: number;
}

export interface ReplicateResult {
  data: {
    action: "inserted" | "updated" | "noop";
    changed: boolean;
    order_id: string;
  };
}

// Resolved, validated config. Mirrors the keys stored in the config table.
export interface AppConfig {
  WANSOFT_BASE_URL: string;
  WANSOFT_USER_CODE: string;
  REMOTE_API_BASE_URL: string;
  REMOTE_API_TOKEN: string;
  REPLICATION_INTERVAL_MS: number;
}

export type LogLevel = "info" | "warn" | "error";

export interface LogRow {
  id: number;
  ts: number;
  level: LogLevel;
  message: string;
  order_number: number | null;
  status: string | null;
  error: string | null;
}

export type ReplicationStatus =
  | "pending"
  | "replicating"
  | "success"
  | "noop"
  | "failed";

export interface ReplicationRow {
  order_number: number;
  operation_date: string;
  status: ReplicationStatus;
  action: string | null;
  remote_id: string | null;
  error: string | null;
  updated_at: number;
}

export interface WorkerState {
  id: 1;
  last_cycle_at: number | null;
  active_count: number;
  last_error: string | null;
  restart_requested: number; // 0 | 1
}
