export function getOrderLogPrefix(order: {
  orderNumber: number;
  operationDate: string;
}): string {
  return `[order_number=${order.orderNumber}, operation_date=${order.operationDate.split("T")[0]}] `;
}
