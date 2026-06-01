import type { UpdateHeartbeat } from "./update-heartbeat.type.js";
import type { WorkerState } from "./worker-state.type.js";

export interface WorkerStateRepo {
  getWorkerState: () => Promise<WorkerState>;
  updateHeartbeat: (state: UpdateHeartbeat) => Promise<void>;
  requestRestart: () => Promise<void>;
  consumeRestartFlag: () => Promise<boolean>;
  clearAll: () => Promise<void>;
}
