const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

function sendSuccess(req, res, message, data = null, statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (meta !== null && meta !== undefined) {
    payload.meta = meta;
  }

  res.status(statusCode).json(payload);
}

function sendError(req, res, message, statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (errors !== null && errors !== undefined) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
}

function sendPaginated(req, res, message, data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const meta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };

  sendSuccess(req, res, message, data, 200, meta);
}

module.exports = {
  HTTP_STATUS,
  sendSuccess,
  sendError,
  sendPaginated,
};