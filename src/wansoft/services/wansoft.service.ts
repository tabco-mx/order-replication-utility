import { toWansoftDate } from "../helpers/to-wansoft-date.js";
import { Order, OrderItem } from "../types.js";

interface Wrapped<T> {
  Result: T;
}

export function createWansoftService({ baseUrl }: { baseUrl: string }) {
  async function wansoftFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, init);
    if (!res.ok) {
      throw new Error(`Wansoft ${res.status} ${res.statusText} on ${path}`);
    }
    const body = (await res.json()) as Wrapped<T>;
    return body.Result;
  }

  // Resolve the userId from the configured user code. Done once at startup.
  async function getUserId(userCode: string): Promise<string> {
    return wansoftFetch<string>("/WebApi/api/user/SelUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userCode),
    });
  }

  // List open orders for the user.
  function getOrders(userId: string): Promise<Order[]> {
    return wansoftFetch<Order[]>(
      `/WebApi/api/order/getorders?userid=${userId}`,
      { method: "POST" },
    );
  }

  // Fetch the line items for a single order.
  function getOrderItems(order: Order): Promise<OrderItem[]> {
    const query =
      `orderNumber=${order.OrderNumber}` +
      `&operationDate=${toWansoftDate(order.OperationDate)}`;
    return wansoftFetch<OrderItem[]>(
      `/WebApi/api/order/GetOrderDetail?${query}`,
      { method: "POST" },
    );
  }

  // Check if the order has associated sale.
  async function getHasAssociatedSale(order: {
    orderNumber: number;
    operationDate: string;
  }): Promise<boolean> {
    const result = await wansoftFetch<number>(
      `/WebApi/api/order/HasAssociatedSale?orderNumber=${order.orderNumber}&operationDate=${toWansoftDate(order.operationDate)}`,
      { method: "POST" },
    );

    return result === 1;
  }

  return {
    getUserId,
    getOrders,
    getOrderItems,
    getHasAssociatedSale,
  };
}
