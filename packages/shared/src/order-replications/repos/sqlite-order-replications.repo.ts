import type Database from "better-sqlite3";
import type { Replication } from "../types/order-replication.type.js";
import type { ReplicationsRepo } from "../types/order-replications-repo.type.js";

export function createSqliteOrderReplicationsRepo({
  db,
}: {
  db: Database.Database;
}): ReplicationsRepo {
  return {
    async upsertReplication(data) {
      db.prepare(
        `INSERT INTO order_replications
           (order_number, operation_date, status, action, remote_id, error, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(order_number, operation_date) DO UPDATE SET
           status     = excluded.status,
           action     = excluded.action,
           remote_id  = excluded.remote_id,
           error      = excluded.error,
           updated_at = excluded.updated_at`,
      ).run(
        data.order_number,
        data.operation_date,
        data.status,
        data.action ?? null,
        data.remote_id ?? null,
        data.error ?? null,
        Date.now(),
      );
    },

    async listActive() {
      return db
        .prepare(
          `SELECT * FROM order_replications
           WHERE status IN ('pending', 'replicating')
           ORDER BY updated_at DESC`,
        )
        .all() as Replication[];
    },

    async listRecent(limit = 20) {
      return db
        .prepare(
          `SELECT * FROM order_replications
           WHERE status IN ('success', 'noop', 'failed')
           ORDER BY updated_at DESC LIMIT ?`,
        )
        .all(limit) as Replication[];
    },

    async listFailed(limit = 20) {
      return db
        .prepare(
          "SELECT * FROM order_replications WHERE status = 'failed' ORDER BY updated_at DESC LIMIT ?",
        )
        .all(limit) as Replication[];
    },

    async counts() {
      const row = db
        .prepare(
          `SELECT
             SUM(CASE WHEN status IN ('success', 'noop') THEN 1 ELSE 0 END) AS done,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)            AS failed,
             SUM(CASE WHEN status IN ('pending', 'replicating') THEN 1 ELSE 0 END) AS active
           FROM order_replications`,
        )
        .get() as {
        done: number | null;
        failed: number | null;
        active: number | null;
      };

      return {
        totalReplicated: row.done ?? 0,
        failures: row.failed ?? 0,
        active: row.active ?? 0,
      };
    },

    async clearReplications() {
      db.prepare("DELETE FROM replications").run();
    },
  };
}
