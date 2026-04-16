const AppError = class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
};

const deriveErrorCode = (statusCode, err) => {
  if (err.errorCode) return err.errorCode;
  if (err.code) return err.code;
  const codeMap = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
  };
  return codeMap[statusCode] || 'INTERNAL_ERROR';
};

const normalizeError = (err) => {
  if (err instanceof AppError) {
    return err;
  }

  if (err.name === 'JsonWebTokenError') {
    const normalized = new AppError('Invalid token', 401, true);
    normalized.errorCode = 'INVALID_TOKEN';
    return normalized;
  }

  if (err.name === 'TokenExpiredError') {
    const normalized = new AppError('Token expired', 401, true);
    normalized.errorCode = 'TOKEN_EXPIRED';
    return normalized;
  }

  if (err.isJoi === true || (err.name === 'ValidationError' && err.details)) {
    const normalized = new AppError(err.message, 400, true);
    normalized.errorCode = 'VALIDATION_ERROR';
    return normalized;
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    const normalized = new AppError('Resource already exists', 409, true);
    normalized.errorCode = 'CONFLICT';
    return normalized;
  }

  if (err.code === 'SQLITE_NOTFOUND') {
    const normalized = new AppError('Resource not found', 404, true);
    normalized.errorCode = 'NOT_FOUND';
    return normalized;
  }

  const normalized = new AppError(
    err.message || 'Internal server error',
    err.statusCode || err.status || 500,
    false
  );
  normalized.originalStack = err.stack;
  return normalized;
};

const errorHandler = (err, req, res, next) => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const normalizedError = normalizeError(err);

  const { statusCode, isOperational, message, stack } = normalizedError;

  if (nodeEnv === 'development') {
    console.error('[ErrorHandler] Error:', {
      message,
      statusCode,
      isOperational,
      path: req.path,
      method: req.method,
      stack: stack || normalizedError.originalStack || err.stack,
    });
  } else {
    if (!isOperational) {
      console.error('[ErrorHandler] CRITICAL - Unexpected error:', {
        message,
        statusCode,
        path: req.path,
        method: req.method,
        stack: stack || normalizedError.originalStack || err.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const isProduction = nodeEnv === 'production';
  const safeMessage = isProduction && !isOperational ? 'Internal server error' : message;
  const errorCode = deriveErrorCode(statusCode, normalizedError);

  const responseBody = {
    status: 'error',
    statusCode,
    message: safeMessage,
    errorCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (nodeEnv === 'development') {
    responseBody.stack = stack || normalizedError.originalStack || err.stack;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
module.exports.AppError = AppError;