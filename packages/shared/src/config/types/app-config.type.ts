// Resolved, validated config. Mirrors the keys stored in the config table.

export interface AppConfig {
  WANSOFT_BASE_URL: string;
  WANSOFT_USER_CODE: string;
  REMOTE_API_BASE_URL: string;
  REMOTE_API_TOKEN: string;
  REPLICATION_INTERVAL_MS: number;
}
