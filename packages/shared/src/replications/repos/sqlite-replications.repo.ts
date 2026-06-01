import type Database from "better-sqlite3";
import type { ReplicationCounts } from "../types/replication-counts.type.js";
import type { ReplicationRow } from "../types/replication-row.type.js";
import type { ReplicationsRepo } from "../types/replications-repo.type.js";

export function createSqliteReplicationsRepo({
  db,
}: {
  db: Database.Database;
}): ReplicationsRepo {
  return {
    async upsertReplication(row): Promise<void> {
      db.prepare(
        `INSERT INTO replications
           (order_number, operation_date, status, action, remote_id, error, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(order_number, operation_date) DO UPDATE SET
           status     = excluded.status,
           action     = excluded.action,
           remote_id  = excluded.remote_id,
           error      = excluded.error,
           updated_at = excluded.updated_at`,
      ).run(
        row.order_number,
        row.operation_date,
        row.status,
        row.action ?? null,
        row.remote_id ?? null,
        row.error ?? null,
        Date.now(),
      );
    },

    async listActive(): Promise<ReplicationRow[]> {
      return db
        .prepare(
          `SELECT * FROM replications
           WHERE status IN ('pending', 'replicating')
           ORDER BY updated_at DESC`,
        )
        .all() as ReplicationRow[];
    },

    async listRecent(limit = 20): Promise<ReplicationRow[]> {
      return db
        .prepare(
          `SELECT * FROM replications
           WHERE status IN ('success', 'noop', 'failed')
           ORDER BY updated_at DESC LIMIT ?`,
        )
        .all(limit) as ReplicationRow[];
    },

    async listFailed(limit = 20): Promise<ReplicationRow[]> {
      return db
        .prepare(
          "SELECT * FROM replications WHERE status = 'failed' ORDER BY updated_at DESC LIMIT ?",
        )
        .all(limit) as ReplicationRow[];
    },

    async counts(): Promise<ReplicationCounts> {
      const row = db
        .prepare(
          `SELECT
             SUM(CASE WHEN status IN ('success', 'noop') THEN 1 ELSE 0 END) AS done,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)            AS failed,
             SUM(CASE WHEN status IN ('pending', 'replicating') THEN 1 ELSE 0 END) AS active
           FROM replications`,
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

    async clearReplications(): Promise<void> {
      db.prepare("DELETE FROM replications").run();
    },
  };
}
