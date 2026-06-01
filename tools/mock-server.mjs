// Mock Wansoft + remote API for local development without the real systems.
//
//   node tools/mock-server.mjs
//
// Wansoft mock  -> http://localhost:8080   (SelUser, getorders, GetOrderDetail)
// Remote mock   -> http://localhost:8888   (/replicate-order)
//
// Behaviour designed to exercise the UI:
//   - returns a few open orders
//   - order 99 always 401s (token rejected) so you can see an isolated failure
//   - other orders cycle through inserted -> noop on repeat (changed=false) so the
//     dashboard shows a mix of success/noop over time
//
// Override ports with WANSOFT_PORT / REMOTE_PORT.

import { createServer } from "node:http";

const WANSOFT_PORT = Number(process.env.WANSOFT_PORT) || 8080;
const REMOTE_PORT = Number(process.env.REMOTE_PORT) || 8888;

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

const orders = [
  {
    OperationDate: "2026-05-26T00:00:00",
    OrderNumber: 16,
    OpenedDate: "2026-05-26T20:03:51.753",
    TableNumber: "14",
    Discount: 0,
    Subtotal: 222.41,
    IVA: 35.59,
    IEPS: 0,
    Total: 258,
  },
  {
    OperationDate: "2026-05-26T00:00:00",
    OrderNumber: 17,
    OpenedDate: "2026-05-26T20:05:00.000",
    TableNumber: "3",
    Discount: 0,
    Subtotal: 88,
    IVA: 14.08,
    IEPS: 0,
    Total: 102.08,
  },
  {
    OrderNumber: 98,
    OperationDate: "2026-05-26T00:00:00",
    OpenedDate: "2026-05-26T20:03:51.753",
    TableNumber: "14",
    Discount: 0,
    Subtotal: 222.41,
    IVA: 35.59,
    IEPS: 0,
    Total: 'invalid',
  },
  {
    OperationDate: "2026-05-26T00:00:00",
    OrderNumber: 99,
    OpenedDate: "2026-05-26T20:10:00.000",
    TableNumber: "7",
    Discount: 0,
    Subtotal: 100,
    IVA: 16,
    IEPS: 0,
    Total: 116,
  },
];

const items = [
  {
    ConsecutiveId: 53206,
    DishId: 47,
    Quantity: 1,
    Description: "CRUCIO (Chicken Bacon Burger)",
    Total: 179,
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Track how many times each order has been replicated to alternate inserted -> noop.
const seen = new Map();

createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  switch (u.pathname) {
    case "/WebApi/api/user/SelUser":
      return json(res, 200, { Result: "10" });
    case "/WebApi/api/order/getorders":
      await sleep(10_000);
      return json(res, 200, { Result: orders });
    case "/WebApi/api/order/GetOrderDetail":
      return json(res, 200, { Result: items });
    default:
      return json(res, 404, { error: { message: "not found" } });
  }
}).listen(WANSOFT_PORT, () =>
  console.log(`wansoft mock  -> http://localhost:${WANSOFT_PORT}`),
);

createServer(async (req, res) => {
  await sleep(10_000);

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return json(res, 400, { error: { message: "invalid JSON body" } });
    }
    const orderNumber = payload?.order?.OrderNumber;
    if (orderNumber === undefined) {
      return json(res, 400, {
        error: { message: "OperationDate is required" },
      });
    }
    // Order 99: simulate a rejected token to test failure isolation.
    if (orderNumber === 99) {
      return json(res, 401, { error: { message: "invalid token" } });
    }
    // First time: inserted (changed). After that: noop (unchanged).
    const count = (seen.get(orderNumber) ?? 0) + 1;
    seen.set(orderNumber, count);
    const action = count === 1 ? "inserted" : "noop";
    return json(res, 200, {
      data: {
        action,
        changed: action !== "noop",
        order_id: `mock-${orderNumber}`,
      },
    });
  });
}).listen(REMOTE_PORT, () =>
  console.log(`remote mock   -> http://localhost:${REMOTE_PORT}`),
);
