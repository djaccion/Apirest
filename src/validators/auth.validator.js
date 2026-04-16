const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string()
    .lowercase()
    .trim()
    .max(254)
    .email()
    .required()
    .messages({
      'any.required': 'El email es requerido',
      'string.empty': 'El email es requerido',
      'string.email': 'Debe ser un email válido',
      'string.max': 'El email no debe superar los 254 caracteres',
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'any.required': 'La contraseña es requerida',
      'string.empty': 'La contraseña es requerida',
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.max': 'La contraseña no debe superar los 128 caracteres',
    }),
}).options({
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: false,
});

const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    const errors = error.details.map((detail) => detail.message);

    return res.status(400).json({
      status: 'error',
      message: 'Datos de entrada inválidos',
      errors,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  loginSchema,
  validateLogin,
};