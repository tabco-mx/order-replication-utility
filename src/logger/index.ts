// Shared pino logger. Uses pino-pretty for readable output in dev, raw JSON in prod.
// pino-pretty is a devDependency, so it is only referenced when not in production.

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isProduction
    ? {}
    : { transport: { target: "pino-pretty", options: { translateTime: "SYS:standard" } } }),
});
