import * as env from "./env.js";
import * as Sentry from "@sentry/node";

if (env.NODE_ENV === "production" && env.SENTRY_DSN)
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    sendDefaultPii: true,
  });
