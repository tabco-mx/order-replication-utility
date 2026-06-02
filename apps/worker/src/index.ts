import { createSqliteConfigRepo, openDb } from "@app/shared";
import { createLogger } from "./logger.js";
import { createRunCycle } from "./worker/cycle.js";
import { runWorkerLoop } from "./worker/scheduler.js";

async function main(): Promise<void> {
  const logger = createLogger();

  try {
    const db = openDb();
    const { getOrCreateConfig } = createSqliteConfigRepo({
      db,
    });

    const runCycle = createRunCycle({ getOrCreateConfig, logger });
    runWorkerLoop({ runCycle });
  } catch (err) {
    logger.error({ err }, "Fatal startup error");
    process.exit(1);
  }
}

main();
