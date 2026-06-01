import { WorkerStateUpdate } from "./worker-state-update.type.js";
import type { WorkerState } from "./worker-state.type.js";

export interface WorkerStateRepo {
  getOrCreateWorkerState: () => Promise<WorkerState>;
  updateWorkerState: (data: WorkerStateUpdate) => Promise<void>;
}
