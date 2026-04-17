const AppError = class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
};

const handleMongooseErrors = (err) => {
  if (err.name === 'CastError') {
    const message = `Valor inválido para el campo '${err.path}': ${err.value}`;
    return new AppError(message, 400);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((el) => el.message);
    const message = `Datos de entrada inválidos: ${messages.join('. ')}`;
    return new AppError(message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El campo '${field}' ya existe. Por favor usa un valor diferente`;
    return new AppError(message, 409);
  }

  return err;
};

const handleJWTErrors = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token inválido o malformado. Por favor inicia sesión nuevamente', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Tu sesión ha expirado. Por favor inicia sesión nuevamente', 401);
  }

  return err;
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR INESPERADO:', {
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack,
      error: err,
    });

    res.status(500).json({
      status: 'error',
      message: 'Algo salió mal, intenta de nuevo más tarde',
    });
  }
};

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
  error.message = err.message;

  error = handleMongooseErrors(error);
  error = handleJWTErrors(error);

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${error.message}`
  );

  const env = process.env.NODE_ENV;

  if (env === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

module.exports = errorMiddleware;
module.exports.AppError = AppError;