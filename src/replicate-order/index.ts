// Remote API client. Sends an assembled order + items to /replicate-order.

import { config } from "../config/index.js";
import type { Order, OrderItem } from "../wansoft/index.js";

export interface ReplicatePayload {
  order: Order;
  items: OrderItem[];
}

export interface ReplicateResult {
  data: {
    action: "inserted" | "updated" | "noop";
    changed: boolean;
    order_id: string;
  };
}

interface ErrorBody {
  error?: { message?: string };
}

export async function replicateOrder(payload: ReplicatePayload): Promise<ReplicateResult> {
  const res = await fetch(`${config.REMOTE_API_BASE_URL}/replicate-order`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.REMOTE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // Remote returns { error: { message } } for 400/401 — surface it if present.
    const body = (await res.json().catch(() => undefined)) as ErrorBody | undefined;
    const detail = body?.error?.message ?? res.statusText;
    throw new Error(`Replicate ${res.status}: ${detail}`);
  }

  return (await res.json()) as ReplicateResult;
}
