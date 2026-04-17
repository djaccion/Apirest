export const sendSuccess = (res, data, message = 'Operation completed successfully', statusCode = 200, req = {}) => {
  const requestId = req.id || (req.headers && req.headers['x-request-id']) || 'no-request-id';

  const envelope = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(statusCode).json(envelope);
};

export const sendError = (res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = undefined, req = {}) => {
  const requestId = req.id || (req.headers && req.headers['x-request-id']) || 'no-request-id';

  const errorObject = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObject.details = details;
  }

  const envelope = {
    success: false,
    error: errorObject,
    timestamp: new Date().toISOString(),
    requestId,
  };

  res.status(statusCode).json(envelope);
};

export const sendNotFound = (res, message = 'The requested resource was not found', req = {}) => {
  sendError(res, message, 404, 'NOT_FOUND', undefined, req);
};

export const sendUnauthorized = (res, message = 'Authentication is required to access this resource', req = {}) => {
  sendError(res, message, 401, 'UNAUTHORIZED', undefined, req);
};

export const sendValidationError = (res, details = [], req = {}) => {
  sendError(res, 'Validation failed for the provided input', 422, 'VALIDATION_ERROR', details, req);
};