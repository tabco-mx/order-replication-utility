import type { Logger } from "pino";
import type { createRemoteApiService } from "../remote-api/services/remote-api.service.js";
import type { createWansoftService } from "../wansoft/services/wansoft.service.js";

export type WorkerLogger = Logger;
export type RemoteApiService = ReturnType<typeof createRemoteApiService>;
export type WansoftService = ReturnType<typeof createWansoftService>;
export type Config = {
  wansoft_base_url: string;
  wansoft_user_code: string;
  remote_api_base_url: string;
  remote_api_token: string;
  replication_interval_ms: number;
};

export type CycleContext = {
  stopped_at: Date | null;
  feature_flag_enabled_at: Date | null;
};
