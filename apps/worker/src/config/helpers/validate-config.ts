import { AppConfig } from "@app/shared";

export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  if (!config.WANSOFT_USER_CODE) {
    errors.push("WANSOFT_USER_CODE is required");
  }
  if (!config.WANSOFT_BASE_URL) {
    errors.push("WANSOFT_BASE_URL is required");
  }
  if (!config.REMOTE_API_BASE_URL) {
    errors.push("REMOTE_API_BASE_URL is required");
  }
  if (!config.REMOTE_API_TOKEN) {
    errors.push("REMOTE_API_TOKEN is required");
  }
  if (!config.REPLICATION_INTERVAL_MS) {
    errors.push("REPLICATION_INTERVAL_MS is required");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
