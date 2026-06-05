export const REPLICATION_INTERVAL_MS = process.env.REPLICATION_INTERVAL_MS
  ? Number(process.env.REPLICATION_INTERVAL_MS)
  : 0;
export const WANSOFT_BASE_URL = process.env.WANSOFT_BASE_URL as string;
export const WANSOFT_USER_CODE = process.env.WANSOFT_USER_CODE as string;
export const REMOTE_API_BASE_URL = process.env.REMOTE_API_BASE_URL as string;
export const REMOTE_API_TOKEN = process.env.REMOTE_API_TOKEN as string;
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const SENTRY_DSN = process.env.SENTRY_DSN as string;
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const SENTRY_DEVELOPMENT = process.env.SENTRY_DEVELOPMENT === "true";
export const FEATURE_FLAG = "order_replication_utility";

const errors: Array<string> = [];

if (
  !REPLICATION_INTERVAL_MS ||
  Number.isNaN(REPLICATION_INTERVAL_MS) ||
  REPLICATION_INTERVAL_MS <= 0
) {
  errors.push("REPLICATION_INTERVAL_MS is required");
}

if (!WANSOFT_BASE_URL) {
  errors.push("WANSOFT_BASE_URL is required");
}

if (!REMOTE_API_BASE_URL) {
  errors.push("REMOTE_API_BASE_URL is required");
}

if (!REMOTE_API_TOKEN) {
  errors.push("REMOTE_API_TOKEN is required");
}

if (
  LOG_LEVEL &&
  !["trace", "debug", "info", "warn", "error"].includes(LOG_LEVEL)
) {
  errors.push("LOG_LEVEL must be one of: debug, info, warn, error");
}

if (!WANSOFT_USER_CODE) {
  errors.push("WANSOFT_USER_CODE is required");
}

if (errors.length) {
  throw new Error(errors.join("\n"));
}
