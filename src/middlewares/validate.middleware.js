const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const isBodyMethod = req.method === 'POST' || req.method === 'PUT';
      const data = isBodyMethod
        ? req.body
        : Object.assign({}, req.params, req.query);

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
        }));

        return res.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors,
        });
      }

      if (isBodyMethod) {
        req.body = value;
      } else {
        req.params = value;
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = validate;