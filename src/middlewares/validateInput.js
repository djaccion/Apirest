const { validationResult } = require('express-validator');

const validateInput = (validationRules) => {
  return [
    ...validationRules,
    (req, res, next) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(422).json({
          success: false,
          error: 'Validation failed',
          errors: result.array().map((err) => ({
            field: err.path,
            message: err.msg,
          })),
          requestId: req.requestId || null,
        });
      }
      next();
    },
  ];
};

const validationSchemas = {
  generateToken: [
    require('express-validator').body('username')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('El campo username no puede estar vacío')
      .isLength({ min: 3 })
      .withMessage('El username debe tener al menos 3 caracteres')
      .isLength({ max: 50 })
      .withMessage('El username no puede superar los 50 caracteres'),
    require('express-validator').body('password')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('El campo password no puede estar vacío')
      .isLength({ min: 6 })
      .withMessage('El password debe tener al menos 6 caracteres'),
  ],
  holaEndpoint: [],
};

module.exports = { validateInput, validationSchemas };