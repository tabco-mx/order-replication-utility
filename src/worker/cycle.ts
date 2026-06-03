import { getConfigErrors, isValidConfig } from "../helpers/is-valid-config.js";
import { createRemoteApiService } from "../remote-api/services/remote-api.service.js";
import { createWansoftService } from "../wansoft/services/wansoft.service.js";
import { closeLinkedOrders } from "./close-linked-orders.js";
import { replicateOrders } from "./replication.js";
import type { GetConfig, WorkerLogger } from "./types.js";

export const FALLBACK_INTERVAL_MS = 30_000;

export function createRunCycle({
  getConfig,
  logger,
}: {
  getConfig: GetConfig;
  logger: WorkerLogger;
}): () => Promise<number> {
  let cycleCount = 0;

  return async () => {
    cycleCount += 1;
    let intervalMs = FALLBACK_INTERVAL_MS;
    const cycleLogger = logger.child(
      {},
      {
        msgPrefix: `[${cycleCount}] `,
      },
    );

    try {
      cycleLogger.info("Cycle started");

      const config = await getConfig();

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

      const userId = await wansoftService.getUserId(config.wansoft_user_code);

      await Promise.allSettled([
        replicateOrders({
          logger: cycleLogger,
          remoteApiService,
          userId,
          wansoftService,
        }),
        closeLinkedOrders({
          logger: cycleLogger,
          remoteApiService,
          wansoftService,
        }),
      ]);

      return config.replication_interval_ms;
    } catch (err) {
      cycleLogger.error({ err }, `Cycle aborted, retrying in ${intervalMs}ms`);
      return intervalMs;
    }
  };
}
