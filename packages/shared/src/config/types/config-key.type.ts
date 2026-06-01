export const CONFIG_KEYS = [
  "WANSOFT_BASE_URL",
  "WANSOFT_USER_CODE",
  "REMOTE_API_BASE_URL",
  "REMOTE_API_TOKEN",
  "REPLICATION_INTERVAL_MS",
] as const;

export type ConfigKey = (typeof CONFIG_KEYS)[number];
