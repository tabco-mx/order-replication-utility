export type ReplicateOrderResult = {
  data: {
    action: "inserted" | "updated" | "noop";
    changed: boolean;
    order_id: string;
  };
};

export type LinkedOrder = {
  user_id: string;
  order_id: string;
  order_number: number;
  operation_date: string;
};

export type GetLinkedAndOpenOrdersResult = {
  data: LinkedOrder[];
};
