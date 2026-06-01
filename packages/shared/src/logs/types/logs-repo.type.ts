import type { LogCreate } from "./log-create.type.js";
import type { Log } from "./log.type.js";

export interface LogsRepo {
  insertLog: (data: LogCreate) => Promise<void>;
  listLogs: (opts?: { limit?: number; offset?: number }) => Promise<Log[]>;
  countLogs: () => Promise<number>;
  clearLogs: () => Promise<void>;
}
