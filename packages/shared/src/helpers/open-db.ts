// Single better-sqlite3 connection + schema migration. The DB is the only channel
// between the worker and the UI, so WAL mode lets the UI read while the worker writes.

import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { dataDir, dbPath } from "./paths.js";

let db: Database.Database | undefined;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS config (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  wansoft_base_url        TEXT,
  wansoft_user_code       TEXT,
  remote_api_base_url     TEXT,
  remote_api_token        TEXT,
  replication_interval_ms INTEGER
);

CREATE TABLE IF NOT EXISTS logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id    INTEGER NOT NULL,
  ts           INTEGER NOT NULL,
  level        TEXT NOT NULL,
  message      TEXT NOT NULL,
  status       TEXT,
  error        TEXT,
  order_id     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);

CREATE TABLE IF NOT EXISTS order_replications (
  order_number   INTEGER NOT NULL,
  operation_date TEXT NOT NULL,
  status         TEXT NOT NULL,
  action         TEXT,
  remote_id      TEXT,
  error          TEXT,
  updated_at     INTEGER NOT NULL,
  PRIMARY KEY(order_number, operation_date)
);
CREATE INDEX IF NOT EXISTS idx_repl_status ON order_replications(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS worker_state (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  last_cycle_at     INTEGER,
  last_error        TEXT
);
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
