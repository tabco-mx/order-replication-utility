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
      msgPrefix: logger.msgPrefix + getOrderLogPrefix(order),
    },
  );

  try {
    childLogger.trace("Replicating order...");
    childLogger.trace("Getting order items...");

    const items = await wansoftService.getOrderItems(order);
    childLogger.trace(`Got ${items.length} order items`);

    const result = await remoteApiService.replicateOrder({
      order,
      items,
    });

    childLogger.trace(result.data, "Replicate order succeeded");
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
  const childLogger = logger.child(
    {},
    {
      msgPrefix: "[replicateOrders] ",
    },
  );

  childLogger.debug("Getting linked and open orders...");
  const orders = await wansoftService.getOrders(userId);
  childLogger.debug(`Got ${orders.length} open orders`);

  await Promise.allSettled(
    orders.map((order) =>
      replicateOrder({
        logger: childLogger,
        order,
        remoteApiService,
        wansoftService,
      }),
    ),
  );
}
