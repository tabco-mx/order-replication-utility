import pino from "pino";

export const createLogger = () => {
  const isProduction = process.env.NODE_ENV === "production";

  const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        },
  });

  return logger;
};
