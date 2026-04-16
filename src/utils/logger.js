const winston = require('winston');
const fs = require('fs');
const path = require('path');

// NOTE: Security responsibility - callers must sanitize sensitive data before logging.
// Never pass passwords, full JWT tokens, or sensitive user fields as metadata to this logger.
// The logger does NOT sanitize incoming metadata objects.

const NODE_ENV = process.env.NODE_ENV || 'production';
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-service';

const getLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  switch (NODE_ENV) {
    case 'development':
      return 'debug';
    case 'test':
      return 'error';
    default:
      return 'http';
  }
};

const devConsoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, correlationId, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (correlationId) {
      log += ` [correlationId=${correlationId}]`;
    }
    log += ` ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    const remainingMeta = Object.keys(meta).filter(
      k => !['service', 'environment', 'level', 'timestamp'].includes(k)
    );
    if (remainingMeta.length > 0) {
      const metaObj = {};
      remainingMeta.forEach(k => { metaObj[k] = meta[k]; });
      log += ` ${JSON.stringify(metaObj)}`;
    }
    return log;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const buildTransports = () => {
  const transports = [];

  const consoleFormat = NODE_ENV === 'development' ? devConsoleFormat : jsonFormat;

  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );

  if (NODE_ENV === 'production') {
    const logsDir = path.join(process.cwd(), 'logs');
    fs.mkdirSync(logsDir, { recursive: true });

    let DailyRotateFile;
    try {
      DailyRotateFile = require('winston-daily-rotate-file');
    } catch (e) {
      // winston-daily-rotate-file not available, skip file transports
      DailyRotateFile = null;
    }

    if (DailyRotateFile) {
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, 'error.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '14d',
          maxSize: '20m',
          format: jsonFormat,
          zippedArchive: true,
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, 'combined.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'http',
          maxFiles: '14d',
          maxSize: '20m',
          format: jsonFormat,
          zippedArchive: true,
        })
      );
    }
  }

  return transports;
};

const logger = winston.createLogger({
  level: getLogLevel(),
  silent: NODE_ENV === 'test',
  defaultMeta: {
    service: SERVICE_NAME,
    environment: NODE_ENV,
  },
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' })
  ),
  transports: buildTransports(),
});

module.exports = logger;