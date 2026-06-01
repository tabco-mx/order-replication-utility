import type { AppConfig, Order, OrderItem, ReplicateOrderResult } from "@app/shared";
import { parseErrorResponse } from "../helpers/parse-error-response.js";

export interface ReplicateOrderInput {
  order: Order;
  items: OrderItem[];
}

export function createReplicateOrderService({
  getConfig,
}: {
  getConfig: () => Promise<AppConfig>;
}) {
  return {
    async replicateOrder(
      payload: ReplicateOrderInput,
    ): Promise<ReplicateOrderResult> {
      const config = await getConfig();

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
        const error = await parseErrorResponse(res);
        throw error;
      }

      return (await res.json()) as ReplicateOrderResult;
    },
  };
}
