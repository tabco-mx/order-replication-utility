# CLAUDE.md

Local tool that replicates open orders from a local **Wansoft** API to a remote API, with a
web admin UI. Two processes share one SQLite file — **SQLite is the only channel between them.**

## Architecture (read before changing)

- **Worker** (`apps/worker`) — polls Wansoft each interval, replicates orders concurrently
  (`Promise.allSettled`, isolated — one failure never blocks others), writes status/logs/
  heartbeat to SQLite.
- **Web** (`apps/web`) — Next.js 15 App Router. Server Components read SQLite directly; Server
  Actions mutate it. **No REST API, no client fetching.**
- **Shared** (`packages/shared`, `@app/shared`) — better-sqlite3 (WAL), all queries, config,
  types. Both apps import it.

Three load-bearing decisions — preserve these:
1. **DB is the bus.** No HTTP/IPC between worker and web. Worker writes, web reads/writes config + restart flag.
2. **Config is re-read every cycle** (`getConfig()` inside `runCycle`). Config edits apply next tick — **no restart needed**. Worker loop is self-scheduling `setTimeout`, not `setInterval`.
3. **Restart = DB flag.** Web's restart action sets `restart_requested=1`; worker consumes it each cycle and `process.exit(0)`; the Windows Service (node-windows) restarts it. Web never controls the service directly (works non-elevated).

## Commands

- `npm run build` — shared → worker → web (`next build`).
- `npm run dev` — worker (`--watch`) + Next dev on **:3000**.
- `npm run web` — `next start` (prod web server, manual launch). Worker is the only Windows Service.
- `npm run worker:install` / `:uninstall` — register/remove `order-worker` service (elevated).
- `npm run mock` + `npm run mock:seed` — fake Wansoft (:8080) + remote (:8081), point config at them.

## Conventions

- npm workspaces, Node 22+, TypeScript. Worker/shared = ESM + `tsc`. Web = Next.
- **Never import `@app/shared` (or better-sqlite3) into a `"use client"` component.** DB code
  stays in Server Components / Server Actions / `apps/web/src/lib/*` (marked `server-only`).
- `better-sqlite3` + `@app/shared` are in `serverExternalPackages` (`apps/web/next.config.ts`) —
  keep them there or the native addon breaks `next build`.
- DB at `data/app.db` (gitignored); override with `APP_DB_PATH` (used for test DBs).
- Logging: worker uses pino that also mirrors into the `logs` table (`apps/worker/src/logger.ts`).
- Tailwind via CDN (no build step). Dashboard "live" = `AutoRefresh` client component calling
  `router.refresh()` every 2s — no WebSockets.

## Schema (in `packages/shared/src/db.ts`)

`config(key,value)` · `logs(...)` · `replications(order_number, operation_date, status, action,
remote_id, error, updated_at)` · `worker_state(id=1, last_cycle_at, active_count, last_error,
restart_requested)`. Changing `replications` ripples into the worker — avoid.

## Stale leftovers (not part of the current app)

`src/` (old single-app copy), root `tsconfig.json`, `ui.bat` are remnants of earlier iterations
(the Express/HTMX UI was deleted). Safe to remove — ask first.
