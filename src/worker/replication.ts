import { captureException } from "@sentry/node";
import { Order } from "../wansoft/types.js";
import { getOrderLogPrefix } from "./log-prefix.js";
import type {
  RemoteApiService,
  WansoftService,
  WorkerLogger,
} from "./types.js";
import { NODE_ENV } from "../env.js";

type ReplicateOrderResult = {
  orderNumber: Order["OrderNumber"];
  operationDate: string;
  status: "succeeded" | "failed";
  action?: "inserted" | "updated" | "noop";
  error?: string;
};

export type ReplicateOrdersResult = {
  found: number;
  succeeded: number;
  failed: number;
  inserted: number;
  updated: number;
  noop: number;
  orders: ReplicateOrderResult[];
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getOperationDate(order: Order): string {
  return order.OperationDate.split("T")[0];
}

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
}): Promise<ReplicateOrderResult> {
  const childLogger = logger.child(
    {},
    {
      msgPrefix: getOrderLogPrefix({
        orderNumber: order.OrderNumber,
        operationDate: order.OperationDate,
      }),
    },
  );

  const baseResult = {
    orderNumber: order.OrderNumber,
    operationDate: getOperationDate(order),
  };

  try {
    const items = await wansoftService.getOrderItems(order);

    const result = await remoteApiService.replicateOrder({
      order,
      items,
    });

    return { ...baseResult, status: "succeeded", action: result.data.action };
  } catch (err) {
    if (NODE_ENV === "development") {
      childLogger.error({ err }, "Failed to replicate order");
    }
    captureException(err);
    return { ...baseResult, status: "failed", error: getErrorMessage(err) };
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
      msgPrefix: "[replicate_orders] ",
    },
  );

  try {
    const orders = await wansoftService.getOrders(userId);

    const results = await Promise.all(
      orders.map((order) =>
        replicateOrder({
          logger: childLogger,
          order,
          remoteApiService,
          wansoftService,
        }),
      ),
    );

    const summary: ReplicateOrdersResult = {
      found: orders.length,
      succeeded: results.filter((result) => result.status === "succeeded")
        .length,
      failed: results.filter((result) => result.status === "failed").length,
      inserted: results.filter((result) => result.action === "inserted").length,
      updated: results.filter((result) => result.action === "updated").length,
      noop: results.filter((result) => result.action === "noop").length,
      orders: results,
    };

    childLogger.debug(
      {
        found: summary.found,
        succeeded: summary.succeeded,
        failed: summary.failed,
        inserted: summary.inserted,
        updated: summary.updated,
        noop: summary.noop,
      },
      "Finished replicating orders",
    );
  } catch (err) {
    if (NODE_ENV === "development") {
      childLogger.error({ err }, "Failed to replicate orders");
    }
    captureException(err);
  }
}
