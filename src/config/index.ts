// Reads and validates all configuration from environment variables.
// Throws at import time (startup) if anything required is missing or invalid.

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function intWithDefault(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid env variable ${name}: expected a positive number, got "${raw}"`);
  }
  return value;
}

export const config = Object.freeze({
  WANSOFT_BASE_URL: required("WANSOFT_BASE_URL"),
  WANSOFT_USER_CODE: required("WANSOFT_USER_CODE"),
  REMOTE_API_BASE_URL: required("REMOTE_API_BASE_URL"),
  REMOTE_API_TOKEN: required("REMOTE_API_TOKEN"),
  REPLICATION_INTERVAL_MS: intWithDefault("REPLICATION_INTERVAL_MS", 30_000),
});
