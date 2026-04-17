const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  const isErrorObject = error !== null && typeof error === 'object';

  let statusCode = isErrorObject
    ? error.statusCode || error.status || 500
    : 500;

  let message = isErrorObject && error.message
    ? error.message
    : 'Internal Server Error';

  const validationErrors = isErrorObject && error.errors ? error.errors : null;

  const requestId = req.headers['x-request-id'] || null;

  if (isErrorObject && error instanceof SyntaxError && statusCode === 400) {
    message = 'Malformed JSON in request body';
  }

  if (statusCode < 400) {
    statusCode = 500;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const logPayload = {
    statusCode,
    message,
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
  };

  if (!isProduction) {
    logPayload.stack = isErrorObject && error.stack ? error.stack : undefined;
  }

  if (statusCode >= 500) {
    logger.error(logPayload);
  } else {
    logger.warn(logPayload);
  }

  const responseBody = {
    success: false,
    statusCode,
    message,
    requestId,
    errors: validationErrors,
  };

  if (!isProduction) {
    responseBody.stack = isErrorObject && error.stack ? error.stack : undefined;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;