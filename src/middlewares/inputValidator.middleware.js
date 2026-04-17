const { query, header, validationResult } = require('express-validator');

const validateHolaInput = [
  header('authorization')
    .trim()
    .notEmpty()
    .withMessage('Authorization header is required and must have format Bearer token')
    .matches(/^Bearer\s.+/)
    .withMessage('Authorization header is required and must have format Bearer token'),

  query('lang')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 10 })
    .withMessage('lang must be an alphabetic value of maximum 10 characters')
    .isAlpha()
    .withMessage('lang must be an alphabetic value of maximum 10 characters'),
];

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateHolaInput, handleValidationErrors };