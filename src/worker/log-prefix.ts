export function getOrderLogPrefix(order: {
  orderNumber: number;
  operationDate: string;
}): string {
  return `[OrderNumber=${order.orderNumber}, OperationDate=${order.operationDate.split("T")[0]}] `;
}
