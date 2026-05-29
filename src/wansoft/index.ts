// Local Wansoft API client. All responses wrap their payload in { Result: ... }.

import { config } from "../config/index.js";

export interface Order {
  OperationDate: string;
  OrderNumber: number;
  OpenedDate: string;
  TableNumber: string;
  Discount: number;
  Subtotal: number;
  IVA: number;
  IEPS: number;
  Total: number;
}

export interface OrderItem {
  ConsecutiveId: number;
  DishId: number;
  Quantity: number;
  Description: string;
  Total: number;
}

interface Wrapped<T> {
  Result: T;
}

async function wansoftFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.WANSOFT_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Wansoft ${res.status} ${res.statusText} on ${path}`);
  }
  const body = (await res.json()) as Wrapped<T>;
  return body.Result;
}

// Step 1 — resolve the userId from the configured user code. Done once at startup.
export function getUserId(): Promise<string> {
  return wansoftFetch<string>("/webapi/SelUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.WANSOFT_USER_CODE), // raw JSON string, e.g. "005"
  });
}

// Step 2 — list open orders for the user.
export function getOrders(userId: string): Promise<Order[]> {
  return wansoftFetch<Order[]>(`/webapi/getorders?userId=${encodeURIComponent(userId)}`);
}

// Step 3 — fetch the line items for a single order.
export function getOrderItems(order: Order): Promise<OrderItem[]> {
  const query =
    `orderNumber=${order.OrderNumber}` +
    `&operationDate=${encodeURIComponent(order.OperationDate)}`;
  return wansoftFetch<OrderItem[]>(`/webapi/getorderdetail?${query}`);
}
