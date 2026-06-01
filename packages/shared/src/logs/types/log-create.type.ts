import type { LogLevel } from "./log-level.type.js";

export interface LogCreate {
  level: LogLevel;
  message: string;
  order_number?: number | null;
  status?: string | null;
  error?: string | null;
}
