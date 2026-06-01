export interface WorkerState {
  id: 1;
  last_cycle_at: number | null;
  active_count: number;
  last_error: string | null;
  restart_requested: number; // 0 | 1
}
