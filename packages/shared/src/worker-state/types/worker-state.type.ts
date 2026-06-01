export interface WorkerState {
  id: number;
  last_cycle_at: number | null;
  last_error: string | null;
}
