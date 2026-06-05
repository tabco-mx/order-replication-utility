import "./instrument.js";

import * as env from "./env.js";
import { createLogger } from "./logger.js";
import { createRunCycle } from "./worker/cycle.js";
import { runWorkerLoop } from "./worker/scheduler.js";
import { Config, CycleContext } from "./worker/types.js";

import { captureException } from "@sentry/node";

async function main(): Promise<void> {
  const logger = createLogger();

  if (env.SENTRY_DEVELOPMENT) {
    logger.warn(
      "SENTRY_DEVELOPMENT is enabled; Sentry is capturing logs and errors. This can affect quota in production, be careful.",
    );
  }

  try {
    const config: Config = {
      wansoft_base_url: env.WANSOFT_BASE_URL,
      wansoft_user_code: env.WANSOFT_USER_CODE,
      remote_api_base_url: env.REMOTE_API_BASE_URL,
      remote_api_token: env.REMOTE_API_TOKEN,
      replication_interval_ms: env.REPLICATION_INTERVAL_MS,
    };

    const context: CycleContext = {
      userId: null,
      stopped_at: null,
    };

    const runCycle = createRunCycle({ logger, config, context });
    runWorkerLoop({ runCycle });
  } catch (err) {
    if (env.NODE_ENV === "development") {
      logger.error({ err }, "Fatal startup error");
    }
    captureException(err);
    process.exit(1);
  }
}

main();
