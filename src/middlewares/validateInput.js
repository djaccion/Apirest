const { validationResult } = require('express-validator');
const logger = require('../config/logger');

function validateInput(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true });

  logger.warn('Validation failed', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    errorCount: errors.length,
  });

  return res.status(422).json({
    status: 'error',
    code: 'VALIDATION_ERROR',
    message: 'Los datos de entrada no son válidos',
    errors: errors.map(({ path, msg, value }) => ({
      field: path,
      message: msg,
      value,
    })),
  });
}

module.exports = validateInput;