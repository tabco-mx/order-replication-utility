import {
  createSqliteLogsRepo,
  createSqliteWorkerStateRepo,
  createSqliteConfigRepo,
  createSqliteOrderReplicationsRepo,
  openDb,
  Order,
} from "@app/shared";
import { createLogger } from "./logger.js";
import { createWansoftService } from "./wansoft/services/wansoft.service.js";
import { getConfigErrors, isValidConfig } from "./helpers/is-valid-config.js";
import { createRemoteApiService } from "./remote-api/services/remote-api.service.js";

const FALLBACK_INTERVAL_MS = 30_000;

async function main(): Promise<void> {
  const logger = createLogger();

  try {
    const db = openDb();
    const { getOrCreateWorkerState, updateWorkerState } =
      createSqliteWorkerStateRepo({
        db,
      });
    const logsRepo = createSqliteLogsRepo({
      db,
    });
    const { getOrCreateConfig } = createSqliteConfigRepo({
      db,
    });
    const orderReplicationsRepo = createSqliteOrderReplicationsRepo({
      db,
    });

    await getOrCreateWorkerState();

    const runCycle = async () => {
      let intervalMs = FALLBACK_INTERVAL_MS;

      try {
        logger.debug(`Cycle start...`);

        // Get config and validate config from DB.
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

        // Get userId from Wansoft
        logger.debug("Getting userId...");
        const userId = await wansoftService.getUserId(config.wansoft_user_code);
        logger.debug(`Got userId=${userId}`);

        // Replicate each order and close linked orders
        const replicateOrder = async (order: Order) => {
          const childLogger = logger.child(
            {},
            {
              msgPrefix: `[OrderNumber=${order.OrderNumber}, OperationDate=${order.OperationDate.split("T")[0]}] `,
            },
          );

          try {
            childLogger.debug("Replicating order...");

            // Get order items from Wansoft
            childLogger.debug("Getting order items...");

            const items = await wansoftService.getOrderItems(order);
            childLogger.debug(`Got ${items.length} order items`);

            const result = await remoteApiService.replicateOrder({
              order,
              items,
            });

            childLogger.debug(result.data, "Replicate order succeeded");
          } catch (err) {
            childLogger.error({ err }, "Replicate order failed");
          }
        };

        const replicateOrders = async () => {
          logger.debug("Getting linked and open orders...");
          const orders = await wansoftService.getOrders(userId);
          logger.debug(`Got ${orders.length} open orders`);

          await Promise.allSettled(orders.map((order) => replicateOrder(order)));
        };

        const closeLinkedOrder = async (order: {
          user_id: string;
          order_id: string;
          order_number: number;
          operation_date: string;
        }) => {
          const childLogger = logger.child(
            {},
            {
              msgPrefix: `[OrderNumber=${order.order_number}, OperationDate=${order.operation_date}] `,
            },
          );

          try {
            const hasAssociatedSale = await wansoftService.getHasAssociatedSale(
              {
                orderNumber: order.order_number,
                operationDate: order.operation_date,
              },
            );
            if (!hasAssociatedSale) return;

            childLogger.debug(`Closing linked order ${order.order_id}...`);
            await remoteApiService.closeLinkedOrder(order.order_id);
            childLogger.debug(`Closed linked order ${order.order_id}`);
          } catch (err) {
            childLogger.error({ err }, "Close order failed");
          }
        };

        const closeLinkedOrders = async () => {
          const linkedAndOpenOrders =
            await remoteApiService.getLinkedAndOpenOrders();

          if (!linkedAndOpenOrders.data.length) {
            logger.debug("No linked orders to close");
            return;
          }

          logger.debug(
            `Closing ${linkedAndOpenOrders.data.length} linked orders...`,
          );

          await Promise.allSettled(
            linkedAndOpenOrders.data.map((order) => closeLinkedOrder(order)),
          );
        };

        const replicateOrderPs = replicateOrders();
        const closeLinkedOrdersPs = closeLinkedOrders();

        await Promise.allSettled([replicateOrderPs, closeLinkedOrdersPs]);

        logger.debug(`Cycle done, next cycle in ${intervalMs}ms`);
        return config.replication_interval_ms;
      } catch (err) {
        // A cycle-level failure (e.g. getOrders down, or config invalid) — log and retry next tick.
        logger.error({ err }, `Cycle aborted, retrying in ${intervalMs}ms`);
        return intervalMs;
      }
    };

    const loop = async () => {
      const intervalMs = await runCycle();
      setTimeout(loop, intervalMs);
    };

    loop();
  } catch (err) {
    logger.error({ err }, "Fatal startup error");
    process.exit(1);
  }
}

main();
