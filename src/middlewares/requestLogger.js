const crypto = require('crypto');
const morgan = require('morgan');
const logger = require('../utils/logger');

morgan.token('request-id', (req) => req.requestId);

const morganFormat = ':request-id :method :url :status :response-time ms :res[content-length]';

const morganStream = {
  write: (message) => {
    const trimmed = message.trim();
    if (trimmed) {
      logger.info(trimmed);
    }
  },
};

const morganMiddleware = morgan(morganFormat, { stream: morganStream });

const requestLogger = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  morganMiddleware(req, res, next);
};

module.exports = requestLogger;