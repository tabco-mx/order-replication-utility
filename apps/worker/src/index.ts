// Worker: poll Wansoft, replicate open orders to the remote API, write status + logs
// + heartbeat to SQLite. Config is re-read from the DB at the start of every cycle, so
// edits made in the web UI apply on the next tick without a restart. A UI-set restart
// flag still makes the worker exit so the Windows Service restarts it.

import {
  getConfig,
  updateHeartbeat,
  consumeRestartFlag,
  upsertReplication,
  type AppConfig,
  type Order,
} from "@app/shared";
import { logger } from "./logger.js";
import { getUserId, getOrders, getOrderItems } from "./wansoft/index.js";
import { replicateOrder } from "./replicate-order/index.js";

const DAY_MS = 86_400_000;
const FALLBACK_INTERVAL_MS = 30_000;

let userId: string | undefined;
let userIdFetchedAt = 0;
let isRunning = false;

// Fetch userId once, then refresh only if older than a day.
async function ensureUserId(config: AppConfig): Promise<string> {
  if (userId === undefined || Date.now() - userIdFetchedAt > DAY_MS) {
    userId = await getUserId(config);
    userIdFetchedAt = Date.now();
    logger.info(
      `Resolved userId=${userId} for userCode=${config.WANSOFT_USER_CODE}`,
    );
  }
  return userId;
}

function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  if (!config.WANSOFT_USER_CODE) {
    errors.push("WANSOFT_USER_CODE is required");
  }
  if (!config.WANSOFT_BASE_URL) {
    errors.push("WANSOFT_BASE_URL is required");
  }
  if (!config.REMOTE_API_BASE_URL) {
    errors.push("REMOTE_API_BASE_URL is required");
  }
  if (!config.REMOTE_API_TOKEN) {
    errors.push("REMOTE_API_TOKEN is required");
  }
  if (!config.REPLICATION_INTERVAL_MS) {
    errors.push("REPLICATION_INTERVAL_MS is required");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

// Fetch items for one order and replicate it. Writes status rows as it progresses.
// Throws on failure (caught by allSettled) after recording the failed status.
async function replicateOne(config: AppConfig, order: Order): Promise<void> {
  upsertReplication({
    order_number: order.OrderNumber,
    operation_date: order.OperationDate,
    status: "replicating",
  });
  try {
    const items = await getOrderItems(config, order);
    const { data } = await replicateOrder(config, { order, items });
    upsertReplication({
      order_number: order.OrderNumber,
      operation_date: order.OperationDate,
      status: data.action === "noop" ? "noop" : "success",
      action: data.action,
      remote_id: data.order_id,
      error: null,
    });
    logger.info(
      `Order ${order.OrderNumber}: ${data.action} (order_id=${data.order_id})`,
      {
        order_number: order.OrderNumber,
        status: data.action,
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    upsertReplication({
      order_number: order.OrderNumber,
      operation_date: order.OperationDate,
      status: "failed",
      error: message,
    });
    logger.error(`Order ${order.OrderNumber} replication failed`, {
      err,
      order_number: order.OrderNumber,
      status: "failed",
    });
    throw err;
  }
}

// Exit if the UI requested a restart; the Windows Service brings us back with fresh config.
function exitIfRestartRequested(): void {
  if (consumeRestartFlag()) {
    logger.info("Restart requested — exiting so the service restarts");
    process.exit(0);
  }
}

// One poll cycle. Reads current config from the DB, returns the interval to wait next.
async function runCycle(): Promise<number> {
  let intervalMs = FALLBACK_INTERVAL_MS;
  if (isRunning) {
    logger.warn("Previous cycle still running, skipping this tick");
    return intervalMs;
  }
  isRunning = true;
  let activeCount = 0;
  let lastError: string | null = null;
  try {
    exitIfRestartRequested();

    // Re-read config every cycle so UI edits apply without a restart.
    const config = getConfig();
    validateConfig(config);

    intervalMs = config.REPLICATION_INTERVAL_MS;

    const id = await ensureUserId(config);
    const orders = await getOrders(config, id);
    activeCount = orders.length;
    logger.info(`Cycle start: ${orders.length} open order(s)`);

    // Mark all fetched orders pending so the UI shows them immediately.
    for (const order of orders) {
      upsertReplication({
        order_number: order.OrderNumber,
        operation_date: order.OperationDate,
        status: "pending",
      });
    }

    const results = await Promise.allSettled(
      orders.map((order) => replicateOne(config, order)),
    );

    let ok = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") ok++;
      else failed++;
    }
    logger.info(`Cycle done: ${ok} ok, ${failed} failed`);
  } catch (err) {
    // A cycle-level failure (e.g. getOrders down, or config invalid) — log and retry next tick.
    lastError = err instanceof Error ? err.message : String(err);
    logger.error("Cycle aborted", { err });
  } finally {
    updateHeartbeat({
      last_cycle_at: Date.now(),
      active_count: activeCount,
      last_error: lastError,
    });
    isRunning = false;
  }
  return intervalMs;
}

// Self-scheduling loop: the wait between cycles uses the interval read each cycle, so an
// interval change in the UI takes effect on the following tick.
async function loop(): Promise<void> {
  const intervalMs = await runCycle();
  setTimeout(loop, intervalMs);
}

async function main(): Promise<void> {
  logger.info("Starting order replication worker");
  await loop();
}

main().catch((err) => {
  logger.error("Fatal startup error", { err });
  process.exit(1);
});
