import * as env from "./env.js";
import * as Sentry from "@sentry/node";

const enableSentry = env.NODE_ENV === "production" || env.SENTRY_DEVELOPMENT;

if (env.SENTRY_DSN && enableSentry)
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    sendDefaultPii: true,
    enableLogs: true,
  });
