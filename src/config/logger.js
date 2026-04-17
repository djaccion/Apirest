const winston = require('winston');

// SECURITY NOTE: Never log the Authorization header, token values, or any secret.
// This logger must not be used to record sensitive authentication data.

// NOTE: The logs/ directory must exist before the application starts.
// The startup script or Dockerfile is responsible for creating it (e.g., mkdir -p logs).

const { combine, timestamp, errors, splat, json, colorize, printf } = winston.format;

const NODE_ENV = process.env.NODE_ENV || 'development';

const resolveLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  return NODE_ENV === 'production' ? 'info' : 'debug';
};

const logLevel = resolveLogLevel();

const jsonFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  json()
);

const consoleFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  colorize({ all: true }),
  printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level.toUpperCase()} ${message}`;
  })
);

const transports = [];

if (NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: consoleFormat,
    })
  );
}

transports.push(
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat,
    maxsize: 5242880,
    maxFiles: 5,
  })
);

transports.push(
  new winston.transports.File({
    filename: 'logs/combined.log',
    level: logLevel,
    format: jsonFormat,
    maxsize: 10485760,
    maxFiles: 10,
  })
);

const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: process.env.npm_package_name || 'api-hola',
    environment: NODE_ENV,
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: jsonFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: jsonFormat,
    }),
  ],
});

const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
module.exports.stream = stream;