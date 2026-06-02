import { getConfigErrors, isValidConfig } from "../helpers/is-valid-config.js";
import { createRemoteApiService } from "../remote-api/services/remote-api.service.js";
import { createWansoftService } from "../wansoft/services/wansoft.service.js";
import { closeLinkedOrders } from "./close-linked-orders.js";
import { replicateOrders } from "./replication.js";
import type { GetOrCreateConfig, WorkerLogger } from "./types.js";

export const FALLBACK_INTERVAL_MS = 30_000;

export function createRunCycle({
  getOrCreateConfig,
  logger,
}: {
  getOrCreateConfig: GetOrCreateConfig;
  logger: WorkerLogger;
}): () => Promise<number> {
  return async () => {
    let intervalMs = FALLBACK_INTERVAL_MS;

    try {
      logger.debug("Cycle start...");

      const config = await getOrCreateConfig({
        wansoft_base_url: process.env.WANSOFT_BASE_URL,
        wansoft_user_code: process.env.WANSOFT_USER_CODE,
        remote_api_base_url: process.env.REMOTE_API_BASE_URL,
        remote_api_token: process.env.REMOTE_API_TOKEN,
        replication_interval_ms: process.env.REPLICATION_INTERVAL_MS
          ? Number(process.env.REPLICATION_INTERVAL_MS)
          : undefined,
      });

      if (!isValidConfig(config)) {
        const errors = getConfigErrors(config);
        throw new Error("Invalid config: " + errors.join("\n"));
      }

      intervalMs = config.replication_interval_ms;

      const wansoftService = createWansoftService({
        baseUrl: config.wansoft_base_url,
      });

      const remoteApiService = createRemoteApiService({
        baseUrl: config.remote_api_base_url,
        apiToken: config.remote_api_token,
      });

      logger.debug("Getting userId...");
      const userId = await wansoftService.getUserId(config.wansoft_user_code);
      logger.debug(`Got userId=${userId}`);

      await Promise.allSettled([
        replicateOrders({
          logger,
          remoteApiService,
          userId,
          wansoftService,
        }),
        closeLinkedOrders({
          logger,
          remoteApiService,
          wansoftService,
        }),
      ]);

      logger.debug(`Cycle done, next cycle in ${intervalMs}ms`);
      return config.replication_interval_ms;
    } catch (err) {
      logger.error({ err }, `Cycle aborted, retrying in ${intervalMs}ms`);
      return intervalMs;
    }
  };
}
