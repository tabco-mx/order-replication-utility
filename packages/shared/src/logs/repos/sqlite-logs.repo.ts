import type Database from "better-sqlite3";
import type { LogRow } from "../types/log-row.type.js";
import type { LogsRepo } from "../types/logs-repo.type.js";

export function createSqliteLogsRepo({
  db,
}: {
  db: Database.Database;
}): LogsRepo {
  return {
    async insertLog(entry): Promise<void> {
      db.prepare(
        `INSERT INTO logs (ts, level, message, order_number, status, error)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        Date.now(),
        entry.level,
        entry.message,
        entry.order_number ?? null,
        entry.status ?? null,
        entry.error ?? null,
      );
    },

    async listLogs(opts = {}): Promise<LogRow[]> {
      const limit = opts.limit ?? 100;
      const offset = opts.offset ?? 0;
      return db
        .prepare(
          "SELECT * FROM logs ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?",
        )
        .all(limit, offset) as LogRow[];
    },

    async countLogs(): Promise<number> {
      const row = db.prepare("SELECT COUNT(*) AS n FROM logs").get() as {
        n: number;
      };
      return row.n;
    },

    async clearLogs(): Promise<void> {
      db.prepare("DELETE FROM logs").run();
    },

    async dbSizeBytes(): Promise<number> {
      try {
        // TODO
        return 0;
      } catch {
        return 0;
      }
    },
  };
}
