// Single better-sqlite3 connection + schema migration. The DB is the only channel
// between the worker and the UI, so WAL mode lets the UI read while the worker writes.

import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { dataDir, dbPath } from "./paths.js";

let db: Database.Database | undefined;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,
  level        TEXT NOT NULL,
  message      TEXT NOT NULL,
  order_number INTEGER,
  status       TEXT,
  error        TEXT
);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);

CREATE TABLE IF NOT EXISTS replications (
  order_number   INTEGER NOT NULL,
  operation_date TEXT NOT NULL,
  status         TEXT NOT NULL,
  action         TEXT,
  remote_id      TEXT,
  error          TEXT,
  updated_at     INTEGER NOT NULL,
  PRIMARY KEY (order_number, operation_date)
);
CREATE INDEX IF NOT EXISTS idx_repl_status ON replications(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS worker_state (
  id                INTEGER PRIMARY KEY CHECK (id = 1),
  last_cycle_at     INTEGER,
  active_count      INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  restart_requested INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO worker_state (id) VALUES (1);
`;

// Open (or reuse) the shared connection. Creates data/ and runs migrations on first call.
export function openDb(): Database.Database {
  if (db) return db;
  mkdirSync(dataDir, { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}
