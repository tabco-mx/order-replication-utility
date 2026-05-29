// App bootstrap + polling loop.

import { config } from "./config/index.js";
import { getUserId, getOrders, getOrderItems, type Order } from "./wansoft/index.js";
import { replicateOrder } from "./replicate-order/index.js";

const DAY_MS = 86_400_000;

let userId: string | undefined;
let userIdFetchedAt = 0;
let isRunning = false;

// Fetch userId once, then refresh only if older than a day.
async function ensureUserId(): Promise<string> {
  if (userId === undefined || Date.now() - userIdFetchedAt > DAY_MS) {
    userId = await getUserId();
    userIdFetchedAt = Date.now();
    console.log(`Resolved userId=${userId} for userCode=${config.WANSOFT_USER_CODE}`);
  }
  return userId;
}

// Fetch items for one order and replicate it. Throws on failure (caught by allSettled).
async function replicateOne(order: Order): Promise<void> {
  const items = await getOrderItems(order);
  const { data } = await replicateOrder({ order, items });
  console.log(`Order ${order.OrderNumber}: ${data.action} (order_id=${data.order_id})`);
}

async function runCycle(): Promise<void> {
  if (isRunning) {
    console.warn("Previous cycle still running, skipping this tick");
    return;
  }
  isRunning = true;
  try {
    const id = await ensureUserId();
    const orders = await getOrders(id);
    console.log(`Cycle start: ${orders.length} open order(s)`);

    const results = await Promise.allSettled(orders.map(replicateOne));

    let ok = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        ok++;
      } else {
        failed++;
        console.error(`Order replication failed: ${String(result.reason)}`);
      }
    }
    console.log(`Cycle done: ${ok} ok, ${failed} failed`);
  } catch (err) {
    // A cycle-level failure (e.g. getOrders down) — log and let the next tick retry.
    console.error(`Cycle aborted: ${String(err)}`);
  } finally {
    isRunning = false;
  }
}

async function main(): Promise<void> {
  console.log(`Starting order replication, interval=${config.REPLICATION_INTERVAL_MS}ms`);
  await ensureUserId(); // fail fast at startup if Wansoft is unreachable
  await runCycle();
  setInterval(runCycle, config.REPLICATION_INTERVAL_MS);
}

main().catch((err) => {
  console.error(`Fatal startup error: ${String(err)}`);
  process.exit(1);
});
