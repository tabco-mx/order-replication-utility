import { getLinkedOrderLogPrefix } from "./log-prefix.js";
import type {
  LinkedOrder,
  RemoteApiService,
  WansoftService,
  WorkerLogger,
} from "./types.js";

export async function closeLinkedOrder({
  logger,
  order,
  remoteApiService,
  wansoftService,
}: {
  logger: WorkerLogger;
  order: LinkedOrder;
  remoteApiService: RemoteApiService;
  wansoftService: WansoftService;
}): Promise<void> {
  const childLogger = logger.child(
    {},
    {
      msgPrefix: getLinkedOrderLogPrefix(order),
    },
  );

  try {
    const hasAssociatedSale = await wansoftService.getHasAssociatedSale({
      orderNumber: order.order_number,
      operationDate: order.operation_date,
    });
    if (!hasAssociatedSale) return;

    childLogger.debug(`Closing linked order ${order.order_id}...`);
    await remoteApiService.closeLinkedOrder(order.order_id);
    childLogger.debug(`Closed linked order ${order.order_id}`);
  } catch (err) {
    childLogger.error({ err }, "Close order failed");
  }
}

export async function closeLinkedOrders({
  logger,
  remoteApiService,
  wansoftService,
}: {
  logger: WorkerLogger;
  remoteApiService: RemoteApiService;
  wansoftService: WansoftService;
}): Promise<void> {
  const linkedAndOpenOrders = await remoteApiService.getLinkedAndOpenOrders();

  if (!linkedAndOpenOrders.data.length) {
    logger.debug("No linked orders to close");
    return;
  }

  logger.debug(`Closing ${linkedAndOpenOrders.data.length} linked orders...`);

  await Promise.allSettled(
    linkedAndOpenOrders.data.map((order) =>
      closeLinkedOrder({
        logger,
        order,
        remoteApiService,
        wansoftService,
      }),
    ),
  );
}
