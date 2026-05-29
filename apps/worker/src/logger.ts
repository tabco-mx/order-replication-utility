// pino logger (pretty in dev, JSON in prod) that ALSO mirrors each line into the DB
// logs table so the UI can display them. Optional order/status/error context can be
// attached so log rows line up with replication rows.

import pino from "pino";
import { insertLog, type LogLevel } from "@app/shared";

const isProduction = process.env.NODE_ENV === "production";

const pinoLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isProduction
    ? {}
    : { transport: { target: "pino-pretty", options: { translateTime: "SYS:standard" } } }),
});

interface LogContext {
  err?: unknown;
  order_number?: number | null;
  status?: string | null;
}

function errToString(err: unknown): string {
  if (err instanceof Error) return err.stack ?? `${err.name}: ${err.message}`;
  return String(err);
}

function emit(level: LogLevel, message: string, ctx?: LogContext): void {
  const error = ctx?.err !== undefined ? errToString(ctx.err) : null;
  // Mirror to console via pino (with the error object for a proper stack).
  if (ctx?.err !== undefined) pinoLogger[level]({ err: ctx.err }, message);
  else pinoLogger[level](message);
  // Mirror to DB for the UI. Never let a logging failure crash the worker.
  try {
    insertLog({
      level,
      message,
      order_number: ctx?.order_number ?? null,
      status: ctx?.status ?? null,
      error,
    });
  } catch {
    pinoLogger.warn("failed to persist log row");
  }
}

export const logger = {
  info: (message: string, ctx?: LogContext) => emit("info", message, ctx),
  warn: (message: string, ctx?: LogContext) => emit("warn", message, ctx),
  error: (message: string, ctx?: LogContext) => emit("error", message, ctx),
};
