import { Config } from "@app/shared";

export type ValidatedConfig = {
  id: number;
  worker_id: number;
  wansoft_user_code: string;
  wansoft_base_url: string;
  remote_api_base_url: string;
  remote_api_token: string;
  replication_interval_ms: number;
};

export function isValidConfig(config: Config): config is ValidatedConfig {
  const errors = getConfigErrors(config);

  if (errors.length > 0) {
    return false;
  }

  return true;
}

export const getConfigErrors = (config: Config): string[] => {
  const errors: string[] = [];
  if (!config.wansoft_user_code) {
    errors.push("wansoft_user_code is required");
  }
  if (!config.wansoft_base_url) {
    errors.push("wansoft_base_url is required");
  }
  if (!config.remote_api_base_url) {
    errors.push("remote_api_base_url is required");
  }
  if (!config.remote_api_token) {
    errors.push("remote_api_token is required");
  }

  if (!config.replication_interval_ms) {
    errors.push("replication_interval_ms is required");
  } else if (config.replication_interval_ms <= 0) {
    errors.push("replication_interval_ms must be positive");
  }

  return errors;
};
