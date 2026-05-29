// Per-order replication status. The worker upserts a row as each order progresses;
// the UI reads active / recent / failed views for the dashboard.

import { openDb } from "./db.js";
import type { ReplicationRow, ReplicationStatus } from "./types.js";

export interface UpsertReplication {
  order_number: number;
  operation_date: string;
  status: ReplicationStatus;
  action?: string | null;
  remote_id?: string | null;
  error?: string | null;
}

export function upsertReplication(row: UpsertReplication): void {
  const db = openDb();
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
}

export function listActive(): ReplicationRow[] {
  const db = openDb();
  return db
    .prepare(
      `SELECT * FROM replications
       WHERE status IN ('pending', 'replicating')
       ORDER BY updated_at DESC`,
    )
    .all() as ReplicationRow[];
}

export function listRecent(limit = 20): ReplicationRow[] {
  const db = openDb();
  return db
    .prepare(
      `SELECT * FROM replications
       WHERE status IN ('success', 'noop', 'failed')
       ORDER BY updated_at DESC LIMIT ?`,
    )
    .all(limit) as ReplicationRow[];
}

export function listFailed(limit = 20): ReplicationRow[] {
  const db = openDb();
  return db
    .prepare(
      "SELECT * FROM replications WHERE status = 'failed' ORDER BY updated_at DESC LIMIT ?",
    )
    .all(limit) as ReplicationRow[];
}

export function counts(): { totalReplicated: number; failures: number; active: number } {
  const db = openDb();
  const row = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status IN ('success', 'noop') THEN 1 ELSE 0 END) AS done,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)            AS failed,
         SUM(CASE WHEN status IN ('pending', 'replicating') THEN 1 ELSE 0 END) AS active
       FROM replications`,
    )
    .get() as { done: number | null; failed: number | null; active: number | null };
  return {
    totalReplicated: row.done ?? 0,
    failures: row.failed ?? 0,
    active: row.active ?? 0,
  };
}

export function clearReplications(): void {
  openDb().prepare("DELETE FROM replications").run();
}
