import type {
  GetLinkedAndOpenOrdersResult,
  Order,
  OrderItem,
  ReplicateOrderResult,
} from "@app/shared";
import { parseErrorResponse } from "../helpers/parse-error-response.js";

export function createRemoteApiService({
  baseUrl,
  apiToken,
}: {
  baseUrl: string;
  apiToken: string;
}) {
  return {
    async replicateOrder(input: {
      order: Order;
      items: OrderItem[];
    }): Promise<ReplicateOrderResult> {
      const res = await fetch(`${baseUrl}/replicate-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        // Remote returns { error: { message } } for 400/401 — surface it if present.
        const error = await parseErrorResponse(res);
        throw new Error(error.message);
      }

      return (await res.json()) as ReplicateOrderResult;
    },

    async getLinkedAndOpenOrders(): Promise<GetLinkedAndOpenOrdersResult> {
      const res = await fetch(`${baseUrl}/linked-and-open-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!res.ok) {
        // Remote returns { error: { message } } for 400/401 — surface it if present.
        const error = await parseErrorResponse(res);
        throw new Error(error.message);
      }

      return (await res.json()) as GetLinkedAndOpenOrdersResult;
    },

    async closeLinkedOrder(orderId: string): Promise<void> {
      const res = await fetch(`${baseUrl}/close-linked-order/${orderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (!res.ok) {
        // Remote returns { error: { message } } for 400/401 — surface it if present.
        const error = await parseErrorResponse(res);
        throw new Error(error.message);
      }
    },
  };
}
