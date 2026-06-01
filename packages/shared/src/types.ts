// Shared domain types used by both the worker and the UI.

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

export type ReplicateOrderResult = {
  data: {
    action: "inserted" | "updated" | "noop";
    changed: boolean;
    order_id: string;
  };
};
