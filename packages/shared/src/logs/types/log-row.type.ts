import type { LogLevel } from "./log-level.type.js";

export interface LogRow {
  id: number;
  ts: number;
  level: LogLevel;
  message: string;
  order_number: number | null;
  status: string | null;
  error: string | null;
}
