import type Database from "better-sqlite3";
import type { LogsRepo } from "../../logs/types/logs-repo.type.js";
import type { ReplicationsRepo } from "../../replications/types/replications-repo.type.js";
import type { WorkerStateRepo } from "../types/worker-state-repo.type.js";
import type { WorkerState } from "../types/worker-state.type.js";

export function createSqliteWorkerStateRepo({
  db,
  logsRepo,
  replicationsRepo,
}: {
  db: Database.Database;
  logsRepo: LogsRepo;
  replicationsRepo: ReplicationsRepo;
}): WorkerStateRepo {
  return {
    async getWorkerState(): Promise<WorkerState> {
      return db
        .prepare("SELECT * FROM worker_state WHERE id = 1")
        .get() as WorkerState;
    },

    async updateHeartbeat(state): Promise<void> {
      db.prepare(
        `UPDATE worker_state
         SET last_cycle_at = ?, active_count = ?, last_error = ?
         WHERE id = 1`,
      ).run(state.last_cycle_at, state.active_count, state.last_error ?? null);
    },

    async requestRestart(): Promise<void> {
      db.prepare(
        "UPDATE worker_state SET restart_requested = 1 WHERE id = 1",
      ).run();
    },

    async consumeRestartFlag(): Promise<boolean> {
      const tx = db.transaction(() => {
        const row = db
          .prepare("SELECT restart_requested FROM worker_state WHERE id = 1")
          .get() as { restart_requested: number };
        if (row.restart_requested) {
          db.prepare(
            "UPDATE worker_state SET restart_requested = 0 WHERE id = 1",
          ).run();
          return true;
        }
        return false;
      });
      return tx();
    },

    async clearAll(): Promise<void> {
      await logsRepo.clearLogs();
      await replicationsRepo.clearReplications();
      db.exec("VACUUM");
    },
  };
}
