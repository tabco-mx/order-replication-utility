export interface Config {
  id: number;
  wansoft_base_url: string | null;
  wansoft_user_code: string | null;
  remote_api_base_url: string | null;
  remote_api_token: string | null;
  replication_interval_ms: number | null;
}
