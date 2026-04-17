const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map((error) => ({
      field: error.path || error.param || error.field,
      msg: error.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    handleValidationErrors(req, res, next);
  };
};

module.exports = {
  handleValidationErrors,
  validate,
};