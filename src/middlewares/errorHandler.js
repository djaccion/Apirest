const logger = require('../config/logger');

const classifyError = (err) => {
  if (err.name === 'ValidationError' || Array.isArray(err.errors)) {
    return 'VALIDATION_ERROR';
  }

  if (err.name === 'JsonWebTokenError') {
    return 'JWT_INVALID';
  }

  if (err.name === 'TokenExpiredError') {
    return 'JWT_EXPIRED';
  }

  if (err.name === 'NotBeforeError') {
    return 'JWT_NOT_BEFORE';
  }

  if (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, 'body')) {
    return 'MALFORMED_JSON';
  }

  const statusCode = err.statusCode || err.status;
  if (statusCode === 404) {
    return 'NOT_FOUND';
  }

  return 'INTERNAL_SERVER_ERROR';
};

const normalizeStatusCode = (err) => {
  const code = err.statusCode || err.status;
  if (typeof code === 'number' && code >= 400 && code <= 599) {
    return code;
  }
  return 500;
};

const errorHandler = (err, req, res, next) => {
  try {
    const statusCode = normalizeStatusCode(err);
    const errorType = classifyError(err);
    const isProduction = process.env.NODE_ENV === 'production';
    const isServerError = statusCode >= 500;

    let clientMessage;
    if (isProduction && isServerError) {
      clientMessage = 'Internal server error';
    } else {
      clientMessage = err.message || 'An unexpected error occurred';
    }

    let errorDetails;
    if (Array.isArray(err.errors) && err.errors.length > 0) {
      if (!(isProduction && isServerError)) {
        errorDetails = err.errors;
      }
    }

    const payload = {
      success: false,
      error: {
        type: errorType,
        message: clientMessage,
        ...(errorDetails !== undefined && { details: errorDetails }),
        code: err.code || undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        ...(req.id !== undefined && { requestId: req.id }),
      },
    };

    if (payload.error.code === undefined) {
      delete payload.error.code;
    }

    const logMetadata = {
      statusCode,
      method: req.method,
      url: req.originalUrl,
      errorType,
      stack: err.stack,
      ...(req.id !== undefined && { requestId: req.id }),
      ...(req.user && req.user.id !== undefined && { userId: req.user.id }),
    };

    if (isServerError) {
      logger.error(err.message || 'Internal server error', logMetadata);
    } else {
      logger.warn(err.message || 'Client error', logMetadata);
    }

    if (res.headersSent) {
      return next(err);
    }

    return res.status(statusCode).json(payload);
  } catch (handlerError) {
    return next(err);
  }
};

module.exports = { errorHandler, classifyError };