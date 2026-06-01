import type { LogRow } from "./log-row.type.js";
import type { NewLog } from "./new-log.type.js";

export interface LogsRepo {
  insertLog: (entry: NewLog) => Promise<void>;
  listLogs: (opts?: { limit?: number; offset?: number }) => Promise<LogRow[]>;
  countLogs: () => Promise<number>;
  clearLogs: () => Promise<void>;
  dbSizeBytes: () => Promise<number>;
}
