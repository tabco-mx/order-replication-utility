// Local Wansoft API client. All responses wrap their payload in { Result: ... }.
// Config is passed in (sourced from the DB) rather than imported globally.

import type { AppConfig, Order, OrderItem } from "@app/shared";

interface Wrapped<T> {
  Result: T;
}

async function wansoftFetch<T>(
  config: AppConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${config.WANSOFT_BASE_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Wansoft ${res.status} ${res.statusText} on ${path}`);
  }
  const body = (await res.json()) as Wrapped<T>;
  return body.Result;
}

// Format an ISO OperationDate (e.g. "2026-05-26T00:00:00") to the date Wansoft expects
// for getorderdetail: "yyyy-M-d" with no leading zeros on month/day, e.g. "2026-5-26".
function toWansoftDate(operationDate: string): string {
  const [year, month, day] = operationDate.slice(0, 10).split("-");
  return `${year}-${Number(month)}-${Number(day)}`;
}

// Step 1 — resolve the userId from the configured user code. Done once at startup.
export function getUserId(config: AppConfig): Promise<string> {
  return wansoftFetch<string>(config, "/WebApi/api/user/SelUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.WANSOFT_USER_CODE), // raw JSON string, e.g. "005"
  });
}

// Step 2 — list open orders for the user.
export function getOrders(config: AppConfig, userId: string): Promise<Order[]> {
  return wansoftFetch<Order[]>(
    config,
    `/WebApi/api/order/getorders?userid=${encodeURIComponent(userId)}`,
    { method: "POST" },
  );
}

// Step 3 — fetch the line items for a single order.
export function getOrderItems(config: AppConfig, order: Order): Promise<OrderItem[]> {
  const query =
    `orderNumber=${order.OrderNumber}` +
    `&operationDate=${encodeURIComponent(toWansoftDate(order.OperationDate))}`;
  return wansoftFetch<OrderItem[]>(
    config,
    `/WebApi/api/order/GetOrderDetail?${query}`,
    { method: "POST" },
  );
}
