import "./instrument.js";

import * as env from "./env.js";
import { createLogger } from "./logger.js";
import { createRunCycle } from "./worker/cycle.js";
import { runWorkerLoop } from "./worker/scheduler.js";
import { Config } from "./worker/types.js";

import { captureException } from "@sentry/node";

async function getConfig(): Promise<Config> {
  return {
    wansoft_base_url: env.WANSOFT_BASE_URL,
    wansoft_user_code: env.WANSOFT_USER_CODE,
    remote_api_base_url: env.REMOTE_API_BASE_URL,
    remote_api_token: env.REMOTE_API_TOKEN,
    replication_interval_ms: env.REPLICATION_INTERVAL_MS,
  };
}

async function main(): Promise<void> {
  const logger = createLogger();

  try {
    const runCycle = createRunCycle({ logger, getConfig });
    runWorkerLoop({ runCycle });
  } catch (err) {
    logger.error({ err }, "Fatal startup error");
    captureException(err);
    process.exit(1);
  }
}

main();
