import { LinkedOrder } from "../remote-api/types.js";
import { getOrderLogPrefix } from "./log-prefix.js";
import type {
  RemoteApiService,
  WansoftService,
  WorkerLogger,
} from "./types.js";

type CloseLinkedOrderResult = {
  orderId: LinkedOrder["order_id"];
  orderNumber: LinkedOrder["order_number"];
  operationDate: string;
  status: "closed" | "skipped" | "failed";
  error?: string;
};

export type CloseLinkedOrdersResult = {
  found: number;
  closed: number;
  skipped: number;
  failed: number;
  orders: CloseLinkedOrderResult[];
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getOperationDate(order: LinkedOrder): string {
  return order.operation_date.split("T")[0];
}

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
}): Promise<CloseLinkedOrderResult> {
  const childLogger = logger.child(
    {},
    {
      msgPrefix: getOrderLogPrefix({
        orderNumber: order.order_number,
        operationDate: order.operation_date,
      }),
    },
  );

  const baseResult = {
    orderId: order.order_id,
    orderNumber: order.order_number,
    operationDate: getOperationDate(order),
  };

  try {
    const hasAssociatedSale = await wansoftService.getHasAssociatedSale({
      orderNumber: order.order_number,
      operationDate: order.operation_date,
    });
    if (!hasAssociatedSale) {
      return { ...baseResult, status: "skipped" };
    }

    await remoteApiService.closeLinkedOrder(order.order_id);
    return { ...baseResult, status: "closed" };
  } catch (err) {
    childLogger.error({ err }, "An error occurred");
    return { ...baseResult, status: "failed", error: getErrorMessage(err) };
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
}): Promise<CloseLinkedOrdersResult> {
  const childLogger = logger.child(
    {},
    {
      msgPrefix: "[closeLinkedOrders] ",
    },
  );

  const linkedAndOpenOrders = await remoteApiService.getLinkedAndOpenOrders();

  if (!linkedAndOpenOrders.data.length) {
    const summary: CloseLinkedOrdersResult = {
      found: 0,
      closed: 0,
      skipped: 0,
      failed: 0,
      orders: [],
    };

    childLogger.info(
      `Results: found=${summary.found} closed=${summary.closed} skipped=${summary.skipped} failed=${summary.failed}`,
    );

    return summary;
  }

  const results = await Promise.all(
    linkedAndOpenOrders.data.map((order) =>
      closeLinkedOrder({
        logger: childLogger,
        order,
        remoteApiService,
        wansoftService,
      }),
    ),
  );

  const summary: CloseLinkedOrdersResult = {
    found: linkedAndOpenOrders.data.length,
    closed: results.filter((result) => result.status === "closed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    orders: results,
  };

  childLogger.info(
    `Results: found=${summary.found} closed=${summary.closed} skipped=${summary.skipped} failed=${summary.failed}`,
  );

  return summary;
}
