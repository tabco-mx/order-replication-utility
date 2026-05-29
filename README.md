# Order Replication Utility

A lightweight local tool that periodically replicates open orders from a local **Wansoft**
API to a remote API, with a small web UI for monitoring and configuration.

It is two processes sharing one SQLite file:

- **Worker** — polls Wansoft every interval, replicates each open order to the remote
  `/replicate-order` endpoint (concurrently, isolated — one failing order never blocks the
  others), and writes status + logs + a heartbeat to SQLite. It re-reads config from SQLite
  every cycle, so config edits apply on the next tick.
- **Web** — a [Next.js](https://nextjs.org) (App Router) admin app that reads SQLite directly
  in Server Components and mutates it via Server Actions. No REST API, no client-side fetching.

SQLite is the only channel between them: the worker writes, the web app reads (and writes
config + a restart flag). Neither process calls the other.

## Stack

- Node.js 22+ · TypeScript · npm workspaces (monorepo)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (synchronous, WAL mode)
- [pino](https://getpino.io) logging (pretty in dev, JSON in prod), mirrored into the DB
- [Next.js 15](https://nextjs.org) App Router — Server Components + Server Actions, Tailwind via CDN
- [node-windows](https://github.com/coreybutler/node-windows) to run the worker as a Windows Service

## Layout

```
packages/
  shared/        # @app/shared — SQLite, config, logs, replications, worker state, types
apps/
  worker/        # polling loop, Wansoft + remote clients, Windows-service install/uninstall
  web/           # Next.js admin app (dashboard/logs/config/maintenance)
tools/
  mock-server.mjs       # fake Wansoft + remote API for local dev
  seed-mock-config.mjs  # point config at the mock
data/            # app.db lives here (gitignored)
```

The web app reuses `@app/shared` for all DB access; `better-sqlite3` + `@app/shared` are listed
in `serverExternalPackages` (`apps/web/next.config.ts`) so the native addon is never bundled,
and DB code stays in Server Components / Server Actions (`apps/web/src/lib` is `server-only`).

## Configuration

Config lives in the SQLite `config` table (not `.env`). Edit it on the **Config** page, or
seed it from the CLI. Keys:

| Key                       | Description                            |
| ------------------------- | -------------------------------------- |
| `WANSOFT_BASE_URL`        | Local Wansoft API base URL             |
| `WANSOFT_USER_CODE`       | User code used to resolve the `userId` |
| `REMOTE_API_BASE_URL`     | Remote API base URL                    |
| `REMOTE_API_TOKEN`        | Bearer token for the remote API        |
| `REPLICATION_INTERVAL_MS` | Polling interval (default `30000`)     |

`npm run seed` imports an existing root `.env` (if present) into the config table on first setup.

## How it works

### Worker cycle

1. Resolve `userId` (`POST /WebApi/api/user/SelUser`), refresh if >24h old.
2. Each interval (config re-read from SQLite each cycle): `POST /WebApi/api/order/getorders?userid=…` → open orders.
3. `Promise.allSettled` over orders, each: fetch items
   (`POST /WebApi/api/order/GetOrderDetail?orderNumber=…&operationDate=yyyy-M-d`) →
   `POST {REMOTE}/replicate-order` with `Bearer` auth and `{ order, items }`.
4. Per order it upserts a `replications` row: `pending → replicating → success | noop | failed`.
5. At cycle end it writes a heartbeat (`last_cycle_at`, active count, last error).

### Web (Next.js)

All pages are Server Components reading SQLite directly; mutations are Server Actions.

- **Dashboard `/`** — worker status (from heartbeat: "running" if last cycle < 2×interval,
  else stale), totals, DB size, active + recent replications. Re-renders every 2s via a tiny
  client `AutoRefresh` component calling `router.refresh()` (no WebSockets).
- **Logs `/logs`** — paginated table of stored log rows (`?page&pageSize`).
- **Config `/config`** — edit config (token field blank; left empty keeps the stored token).
  Saving applies on the worker's next cycle — no restart.
- **Maintenance `/maintenance`** — clear logs / replication history / all data (config kept,
  with `VACUUM`), and a restart button.

### Restart (no privileged calls)

The web app cannot reach into the worker's loop (separate process). The restart action sets
`restart_requested = 1` in the DB. The worker checks the flag at the top of each cycle, clears
it, and `process.exit(0)`. The Windows Service (or the dev watcher) restarts it. Works even
when the web app runs non-elevated; restart applies within ≤ one interval. Config changes do
**not** need a restart — the worker re-reads config every cycle.

## Local development (with mock APIs)

```bash
npm install
npm run build

# terminal 1 — fake Wansoft (:8080) + remote (:8081)
npm run mock

# point config at the mock (fast 3s interval)
npm run mock:seed

# terminal 2 — worker (watch) + Next dev server
npm run dev
```

Open <http://localhost:3000>. Orders 16/17 replicate (`inserted`, then `noop` on repeat);
order 99 always 401s so you can see an isolated failure on the dashboard. (The mock's
`getorders` sleeps 10s, so orders visibly sit in `pending`/`replicating` first.)

## Windows deployment

1. Install Node 22+, then `npm install && npm run build`.
2. Seed config: `npm run seed` (imports `.env`), or edit `/config` after first web launch.
3. From an **elevated** prompt: `npm run worker:install` → registers the `order-worker`
   Windows Service (auto-start on boot, auto-restart on exit). Verify in `services.msc`.
   Remove later with `npm run worker:uninstall`.
4. Launch the web UI when needed: `npm run web` (or double-click `web.bat`) →
   <http://localhost:3000>. (`next start` needs a Node server — not a static export — because
   of Server Actions + native better-sqlite3.)
5. The DB is at `data\app.db`. node-windows also writes daemon logs under the service folder.

## Scripts

| Script                  | Action                                             |
| ----------------------- | -------------------------------------------------- |
| `npm run build`         | Build shared → worker → web (`next build`)         |
| `npm run dev`           | Run worker (`--watch`) + Next dev server (:3000)   |
| `npm run web`           | `next start` — the production web server (:3000)   |
| `npm run worker`        | Run the worker as a plain process                  |
| `npm run worker:install`/`:uninstall` | Register/remove the Windows Service  |
| `npm run seed`          | Import root `.env` into the config table           |
| `npm run mock` / `mock:seed` | Local mock APIs + point config at them        |
