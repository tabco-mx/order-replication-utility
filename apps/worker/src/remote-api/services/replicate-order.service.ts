import type { Order, OrderItem, ReplicateOrderResult } from "@app/shared";
import { parseErrorResponse } from "../helpers/parse-error-response.js";

export interface ReplicateOrderInput {
  order: Order;
  items: OrderItem[];
}

export function createReplicateOrderService({
  baseUrl,
  apiToken,
}: {
  baseUrl: string;
  apiToken: string;
}) {
  return {
    async replicateOrder(
      payload: ReplicateOrderInput,
    ): Promise<ReplicateOrderResult> {
      const res = await fetch(`${baseUrl}/replicate-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Remote returns { error: { message } } for 400/401 — surface it if present.
        const error = await parseErrorResponse(res);
        throw new Error(error.message);
      }

      return (await res.json()) as ReplicateOrderResult;
    },
  };
}
