// Single-row worker heartbeat + restart flag. The worker writes; the UI reads to show
// liveness and to request a restart (the worker self-exits, the service restarts it).

import { openDb } from "./db.js";
import { clearLogs } from "./logs.js";
import { clearReplications } from "./replications.js";
import type { WorkerState } from "./types.js";

export function getWorkerState(): WorkerState {
  const db = openDb();
  return db.prepare("SELECT * FROM worker_state WHERE id = 1").get() as WorkerState;
}

export function updateHeartbeat(state: {
  last_cycle_at: number;
  active_count: number;
  last_error?: string | null;
}): void {
  const db = openDb();
  db.prepare(
    `UPDATE worker_state
     SET last_cycle_at = ?, active_count = ?, last_error = ?
     WHERE id = 1`,
  ).run(state.last_cycle_at, state.active_count, state.last_error ?? null);
}

export function requestRestart(): void {
  openDb().prepare("UPDATE worker_state SET restart_requested = 1 WHERE id = 1").run();
}

// Read the flag and reset it atomically. Returns true if a restart was pending.
export function consumeRestartFlag(): boolean {
  const db = openDb();
  const tx = db.transaction(() => {
    const row = db
      .prepare("SELECT restart_requested FROM worker_state WHERE id = 1")
      .get() as { restart_requested: number };
    if (row.restart_requested) {
      db.prepare("UPDATE worker_state SET restart_requested = 0 WHERE id = 1").run();
      return true;
    }
    return false;
  });
  return tx();
}

// Maintenance: wipe logs + replications but keep config. VACUUM so the file shrinks.
export function clearAll(): void {
  clearLogs();
  clearReplications();
  openDb().exec("VACUUM");
}
