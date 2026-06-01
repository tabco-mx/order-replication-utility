export interface UpdateHeartbeat {
  last_cycle_at: number;
  active_count: number;
  last_error?: string | null;
}
