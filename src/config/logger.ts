import { NODE_ENV } from "../constants/env";

import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, errors } = format;

function getCallerFile() {
  const err = new Error();
  const stack = err.stack?.split("\n") || [];
  const callerLine = stack[3] || "";
  const match = callerLine.match(/\/([^/]+\.ts)/);
  return match ? match[1] : "unknown";
}

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label || "default"}] ${level}: ${message}`;
});

const isProd = NODE_ENV === "production";

const loggerConfig = createLogger({
  level: isProd ? "info" : "debug",
  format: isProd
    ? combine(
        errors({ stack: true }),
        timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        myFormat
      )
    : combine(
        colorize(),
        errors({ stack: true }),
        timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        myFormat
      ),
  transports: [
    new transports.Console(),
    ...(isProd
      ? [
          new transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
  //   defaultMeta: {
  //     service: "etf-service",
  //   },
  exceptionHandlers: [
    new transports.File({ filename: "logs/exceptions.log" }),
  ],
});

const logger = {
  info: (msg: string, meta?: object) =>
    loggerConfig.info(msg, { ...meta, label: getCallerFile() }),
  error: (msg: string, meta?: object) =>
    loggerConfig.error(msg, { ...meta, label: getCallerFile() }),
  warn: (msg: string, meta?: object) =>
    loggerConfig.warn(msg, { ...meta, label: getCallerFile() }),
  debug: (msg: string, meta?: object) =>
    loggerConfig.debug(msg, { ...meta, label: getCallerFile() }),
};

export default logger;
