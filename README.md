# Order Replication Utility

Background Node.js service that periodically replicates open orders from a local
**Wansoft** API to a remote API. Every interval (default 30s) it fetches open orders,
fetches each order's line items, and POSTs each `{ order, items }` payload to a remote
`/replicate-order` endpoint. Replications run concurrently and in isolation — one failing
order never blocks the others.

## Stack

- Node.js 24 LTS
- TypeScript, ESM (`"type": "module"`)
- Native `fetch`, native `--env-file` env loading
- No runtime dependencies

## Project Structure

```
order-replication-utility/
  package.json
  tsconfig.json
  .env.example
  src/
    config/index.ts          # env parsing + validation (throws on startup if missing)
    wansoft/index.ts          # local Wansoft API client
    replicate-order/index.ts  # remote API client
    index.ts                  # bootstrap + polling loop
```

## Configuration

All config comes from environment variables. Copy `.env.example` to `.env` and fill in.
If any required variable is missing, the process throws at startup.

| Variable                  | Required | Default | Description                              |
| ------------------------- | -------- | ------- | ---------------------------------------- |
| `WANSOFT_BASE_URL`        | yes      | —       | Local Wansoft API base URL               |
| `WANSOFT_USER_CODE`       | yes      | —       | User code used to resolve the `userId`   |
| `REMOTE_API_BASE_URL`     | yes      | —       | Remote API base URL                      |
| `REMOTE_API_TOKEN`        | yes      | —       | Bearer token for the remote API          |
| `REPLICATION_INTERVAL_MS` | no       | `30000` | Polling interval in milliseconds         |

## Flow

### Startup

1. `config/index.ts` reads + validates env vars (throws if anything required is missing).
2. `ensureUserId()` calls `POST {WANSOFT_BASE_URL}/webapi/SelUser` with body `"005"`
   (the raw JSON-string user code) and stores the returned `Result` as `userId`.
   - Fetched once at startup.
   - Refreshed only if older than 24h.
   - **Not** called every cycle.
3. One cycle runs immediately, then `setInterval` repeats it every `REPLICATION_INTERVAL_MS`.

### Each polling cycle (`runCycle`)

```
ensureUserId()                      ← refresh only if >24h old
   │
   ▼
GET /webapi/getorders?userId=...    ← list of open orders
   │
   ▼
Promise.allSettled(                 ← all orders concurrent + isolated
  orders.map(order =>
     GET /webapi/getorderdetail?orderNumber=..&operationDate=..   ← items
        │
        ▼
     POST {REMOTE_API_BASE_URL}/replicate-order
        headers: Authorization: Bearer <token>, Content-Type: application/json
        body:    { order, items }
  )
)
   │
   ▼
log per-order result (inserted | updated | noop) + summary (ok / failed)
```

- A slow cycle that overruns the interval is skipped via an `isRunning` guard.
- A failed order is logged via `console.error` and does **not** stop the others.
- Failed orders stay open in Wansoft, so they're naturally retried next cycle — no retry queue.

## API Contracts

### Local Wansoft

All responses wrap their payload in `{ "Result": ... }`.

**`POST /webapi/SelUser`** — body `"005"` →
```json
{ "Result": "10" }
```

**`GET /webapi/getorders?userId=10`** →
```json
{ "Result": [ { "OperationDate": "...", "OrderNumber": 16, "OpenedDate": "...", "TableNumber": "14", "Discount": 0, "Subtotal": 222.41, "IVA": 35.59, "IEPS": 0, "Total": 258 } ] }
```

**`GET /webapi/getorderdetail?orderNumber=16&operationDate=...`** →
```json
{ "Result": [ { "ConsecutiveId": 53206, "DishId": 47, "Quantity": 1, "Description": "CRUCIO (Chicken Bacon Burger)", "Total": 179 } ] }
```

### Remote

**`POST /replicate-order`**

Headers:
```
Authorization: Bearer <REMOTE_API_TOKEN>
Content-Type: application/json
```

Body: `{ "order": { ... }, "items": [ ... ] }`

Success:
```json
{ "data": { "action": "inserted", "changed": true, "order_id": "6658f4a49fb6f5c7f7f7dc1a" } }
```

| `data.action` | Meaning                                              | `changed` |
| ------------- | ---------------------------------------------------- | --------- |
| `inserted`    | No previous mapping; new order + mapping created     | `true`    |
| `updated`     | Mapping existed but snapshot changed; order replaced | `true`    |
| `noop`        | Mapping existed and snapshot matched; nothing changed| `false`   |

Errors:
```json
{ "error": { "message": "OperationDate is required" } }
```

| Status | Meaning                      |
| ------ | ---------------------------- |
| `400`  | Invalid payload              |
| `401`  | Invalid / missing bearer token |

Every fetch checks `res.ok` and throws with the status (and the remote `error.message`
when present), so HTTP errors are caught per-order by `Promise.allSettled`.

## Getting Started

```bash
npm install
cp .env.example .env        # edit values

npm run build               # tsc → dist/
npm start                   # node --env-file=.env dist/index.js
```

Development (Node 24 runs TypeScript directly, auto-restart on change):

```bash
npm run dev
```

Requires Node.js 24+ (`node -v`).

## Scripts

| Script              | Action                                            |
| ------------------- | ------------------------------------------------- |
| `npm run build`     | Compile TypeScript to `dist/`                     |
| `npm start`         | Run compiled app with `.env` loaded               |
| `npm run dev`       | Run `src/index.ts` directly with watch + `.env`   |
| `npm run typecheck` | Type-check without emitting                       |
| `npm run clean`     | Remove `dist/`                                     |
