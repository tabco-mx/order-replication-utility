# Order Replication Utility

Worker service that replicates open Wansoft orders to a remote API and closes linked remote orders when Wansoft reports an associated sale.

## Requirements

- Node.js 22 or newer
- npm
- Windows only for `service:install` / `service:uninstall`, because those commands use `node-windows`

## Setup

Install dependencies:

```sh
npm install
```

Create a local `.env` file from the example:

```sh
cp .env.example .env
```

Configure these values:

```dotenv
WANSOFT_BASE_URL=http://localhost:8080
WANSOFT_USER_CODE=000

REMOTE_API_BASE_URL=http://localhost:8888
REMOTE_API_TOKEN=secret

REPLICATION_INTERVAL_MS=30000
NODE_ENV=development
LOG_LEVEL=debug

SENTRY_DSN=
SENTRY_DEVELOPMENT=false
```

Notes:

- `REPLICATION_INTERVAL_MS` must be a positive number.
- `LOG_LEVEL` supports `trace`, `debug`, `info`, `warn`, and `error`.
- `SENTRY_DEVELOPMENT=true` enables Sentry capture outside production. Be careful because captured logs and errors can affect quota.

## Run Locally With Mocks

Start the Wansoft and remote API mock server:

```sh
npm run mock
```

Default mock URLs:

- Wansoft mock: `http://localhost:8080`
- Remote API mock: `http://localhost:8888`

The mock supports the worker routes used by the app:

- `POST /WebApi/api/user/SelUser`
- `POST /WebApi/api/order/getorders`
- `POST /WebApi/api/order/GetOrderDetail`
- `POST /WebApi/api/order/HasAssociatedSale`
- `POST /replicate-order`
- `GET /linked-and-open-orders`
- `PUT /close-linked-order/:orderId`

In another terminal, run the worker in development mode:

```sh
npm run dev
```

`npm run dev` runs TypeScript in watch mode and restarts the worker from `dist/index.js` when compiled output changes.

## Build And Run

Build the project:

```sh
npm run build
```

Start the compiled worker:

```sh
npm start
```

`npm start` runs:

```sh
node --env-file .env dist/index.js
```

## Checks

Run TypeScript without emitting files:

```sh
npm run typecheck
```

Clean compiled output:

```sh
npm run clean
```

## Windows Service

Build before installing the service:

```sh
npm run build
```

Install and start the Windows service from an elevated prompt:

```sh
npm run service:install
```

Uninstall the Windows service from an elevated prompt:

```sh
npm run service:uninstall
```

The service installer reads `.env`, points the service at `dist/index.js`, and runs it with `NODE_ENV=production`.
