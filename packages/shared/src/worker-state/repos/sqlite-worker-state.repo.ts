import type Database from "better-sqlite3";
import type { WorkerStateRepo } from "../types/worker-state-repo.type.js";
import type { WorkerState } from "../types/worker-state.type.js";

export function createSqliteWorkerStateRepo({
  db,
}: {
  db: Database.Database;
}): WorkerStateRepo {
  return {
    async getOrCreateWorkerState() {
      const tx = db.transaction(() => {
        const row = db
          .prepare("SELECT * FROM worker_state WHERE id = 1")
          .get() as WorkerState | null;

        if (row) return row;

        db.prepare(
          `INSERT INTO worker_state (id, last_cycle_at, last_error)
         VALUES (?, ?, ?)`,
        ).run(1, null, null);

        return db
          .prepare("SELECT * FROM worker_state WHERE id = 1")
          .get() as WorkerState;
      });

      return tx();
    },

    async updateWorkerState(data) {
      const fields = Object.entries(data).filter(([_, v]) => v !== undefined);
      db.prepare(
        `UPDATE worker_state
         SET ${fields.map(([k, _v]) => `${k} = ?`).join(", ")}
         WHERE id = 1`,
      ).run(...fields.map(([_, v]) => v));
    },
  };
}
