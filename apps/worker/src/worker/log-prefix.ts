import type { Order } from "@app/shared";
import type { LinkedOrder } from "./types.js";

export function getOrderLogPrefix(order: Order): string {
  return `[OrderNumber=${order.OrderNumber}, OperationDate=${order.OperationDate.split("T")[0]}] `;
}

export function getLinkedOrderLogPrefix(order: LinkedOrder): string {
  return `[OrderNumber=${order.order_number}, OperationDate=${order.operation_date.split("T")[0]}] `;
}
