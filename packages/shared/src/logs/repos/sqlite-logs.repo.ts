import type Database from "better-sqlite3";
import type { Log } from "../types/log.type.js";
import type { LogsRepo } from "../types/logs-repo.type.js";

export function createSqliteLogsRepo({
  db,
}: {
  db: Database.Database;
}): LogsRepo {
  return {
    async insertLog(data) {
      db.prepare(
        `INSERT INTO logs (ts, level, message, order_number, status, error)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        Date.now(),
        data.level,
        data.message,
        data.order_number ?? null,
        data.status ?? null,
        data.error ?? null,
      );
    },

    async listLogs(opts = {}) {
      const limit = opts.limit ?? 100;
      const offset = opts.offset ?? 0;
      return db
        .prepare(
          "SELECT * FROM logs ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?",
        )
        .all(limit, offset) as Log[];
    },

    async countLogs() {
      const row = db.prepare("SELECT COUNT(*) AS n FROM logs").get() as {
        n: number;
      };
      return row.n;
    },

    async clearLogs() {
      db.prepare("DELETE FROM logs").run();
    },
  };
}
