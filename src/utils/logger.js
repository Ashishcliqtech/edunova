const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");
const config = require("../config/config");

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const productionFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const developmentFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
  )
);

const env = config.NODE_ENV || "development";
const isDev = env === "development";

const logger = createLogger({
  level: isDev ? "debug" : "info",
  format: productionFormat,
  defaultMeta: { service: config.APP_NAME || "Edunova" },
  transports: [
    new transports.Console({
      format: isDev ? developmentFormat : productionFormat,
      level: isDev ? "debug" : "error",
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, "exceptions.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
  rejectionHandlers: [
    new transports.File({
      filename: path.join(logDir, "rejections.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

if (!isDev) {
  logger.add(
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    })
  );

  logger.add(
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      level: "info",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    })
  );
}

logger.on("error", (err) => {
  console.error("Logger error:", err);
});

module.exports = logger;
