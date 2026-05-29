// Log persistence. The worker mirrors its pino output here; the UI reads it.

import { statSync } from "node:fs";
import { openDb } from "./db.js";
import { dbPath } from "./paths.js";
import type { LogLevel, LogRow } from "./types.js";

export interface NewLog {
  level: LogLevel;
  message: string;
  order_number?: number | null;
  status?: string | null;
  error?: string | null;
}

export function insertLog(entry: NewLog): void {
  const db = openDb();
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
}

export function listLogs(opts: { limit?: number; offset?: number } = {}): LogRow[] {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const db = openDb();
  return db
    .prepare("SELECT * FROM logs ORDER BY ts DESC, id DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as LogRow[];
}

export function countLogs(): number {
  const db = openDb();
  const row = db.prepare("SELECT COUNT(*) AS n FROM logs").get() as { n: number };
  return row.n;
}

export function clearLogs(): void {
  openDb().prepare("DELETE FROM logs").run();
}

export function dbSizeBytes(): number {
  try {
    return statSync(dbPath).size;
  } catch {
    return 0;
  }
}
