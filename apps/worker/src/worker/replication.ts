import type { Order } from "@app/shared";
import { getOrderLogPrefix } from "./log-prefix.js";
import type {
  RemoteApiService,
  WansoftService,
  WorkerLogger,
} from "./types.js";

export async function replicateOrder({
  logger,
  order,
  remoteApiService,
  wansoftService,
}: {
  logger: WorkerLogger;
  order: Order;
  remoteApiService: RemoteApiService;
  wansoftService: WansoftService;
}): Promise<void> {
  const childLogger = logger.child(
    {},
    {
      msgPrefix: getOrderLogPrefix(order),
    },
  );

  try {
    childLogger.debug("Replicating order...");
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
}

export async function replicateOrders({
  logger,
  remoteApiService,
  userId,
  wansoftService,
}: {
  logger: WorkerLogger;
  remoteApiService: RemoteApiService;
  userId: string;
  wansoftService: WansoftService;
}): Promise<void> {
  logger.debug("Getting linked and open orders...");
  const orders = await wansoftService.getOrders(userId);
  logger.debug(`Got ${orders.length} open orders`);

  await Promise.allSettled(
    orders.map((order) =>
      replicateOrder({
        logger,
        order,
        remoteApiService,
        wansoftService,
      }),
    ),
  );
}
