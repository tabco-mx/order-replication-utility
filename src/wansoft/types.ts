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
