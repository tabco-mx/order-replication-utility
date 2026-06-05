import { captureException } from "@sentry/node";
import { getConfigErrors, isValidConfig } from "../helpers/is-valid-config.js";
import { createRemoteApiService } from "../remote-api/services/remote-api.service.js";
import { createWansoftService } from "../wansoft/services/wansoft.service.js";
import { closeLinkedOrders } from "./close-linked-orders.js";
import { replicateOrders } from "./replication.js";
import type { Config, CycleContext, WorkerLogger } from "./types.js";
import * as Sentry from "@sentry/node";
import { FEATURE_FLAG, NODE_ENV } from "../env.js";

export const FALLBACK_INTERVAL_MS = 30_000;

export function createRunCycle({
  config,
  logger,
  context,
}: {
  config: Config;
  logger: WorkerLogger;
  context: CycleContext;
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
      if (!context.stopped_at && !context.feature_flag_enabled_at) {
        cycleLogger.debug("Starting replication cycle");
      }

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

      const featureFlag = await remoteApiService.getFeatureFlag(FEATURE_FLAG);

      if (!featureFlag.data.enabled_at) {
        if (!context.feature_flag_enabled_at) {
          if (NODE_ENV === "development") {
            cycleLogger.warn(
              { feature_flag: FEATURE_FLAG },
              "Feature flag is disabled; pausing order replication until it is enabled",
            );
          }

          Sentry.logger.warn(
            `Feature flag "${FEATURE_FLAG}" is disabled; pausing order replication until it is enabled.`,
          );

          context.feature_flag_enabled_at = new Date();
        }
        return intervalMs;
      }

      if (context.feature_flag_enabled_at) {
        cycleLogger.debug(
          {
            feature_flag: FEATURE_FLAG,
            enabled_at: featureFlag.data.enabled_at,
          },
          "Feature flag is enabled; resuming order replication",
        );

        Sentry.logger.info(
          `Feature flag "${FEATURE_FLAG}" is enabled at ${featureFlag.data.enabled_at}; resuming order replication.`,
        );

        context.feature_flag_enabled_at = null;
      }

      const userId = await wansoftService.getUserId(config.wansoft_user_code);

      if (!userId) {
        if (!context.stopped_at) {
          cycleLogger.warn(
            "Wansoft user id not found; pausing cycle until it becomes available",
          );

          Sentry.logger.warn(
            "Wansoft user id not found; pausing cycle until it becomes available",
          );

          context.stopped_at = new Date();
        }

        return intervalMs;
      }

      if (context.stopped_at) {
        cycleLogger.debug(
          "Wansoft user id resolved; resuming replication cycle",
        );

        Sentry.logger.info(
          "Wansoft user id resolved; resuming replication cycle",
        );

        context.stopped_at = null;
      }

      await Promise.all([
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
      if (NODE_ENV === "development") {
        cycleLogger.error(
          { err, retry_in_ms: intervalMs },
          "Replication cycle failed; retrying on next interval",
        );
      }

      captureException(err);
      return intervalMs;
    }
  };
}
