// Local Wansoft API client. All responses wrap their payload in { Result: ... }.
// Config is passed in (sourced from the DB) rather than imported globally.

import type { Order, OrderItem } from "@app/shared";
import { toWansoftDate } from "../helpers/to-wansoft-date.js";

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
      `/WebApi/api/order/getorders?userid=${encodeURIComponent(userId)}`,
      { method: "POST" },
    );
  }

  // Fetch the line items for a single order.
  function getOrderItems(order: Order): Promise<OrderItem[]> {
    const query =
      `orderNumber=${order.OrderNumber}` +
      `&operationDate=${encodeURIComponent(toWansoftDate(order.OperationDate))}`;
    return wansoftFetch<OrderItem[]>(
      `/WebApi/api/order/GetOrderDetail?${query}`,
      { method: "POST" },
    );
  }

  return {
    getUserId,
    getOrders,
    getOrderItems,
  };
}
