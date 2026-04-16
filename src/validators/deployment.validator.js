const Joi = require('joi');

const deploymentSchema = Joi.object({
  id_app: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(100)
    .required()
    .messages({
      'any.required': 'id_app es requerido',
      'string.empty': 'id_app no puede estar vacío',
      'string.pattern.base': 'id_app solo permite caracteres alfanuméricos, guiones y guiones bajos',
      'string.max': 'id_app no puede superar los 100 caracteres',
    }),

  status: Joi.string()
    .valid('SUCCESS', 'FAILED', 'IN_PROGRESS')
    .required()
    .messages({
      'any.required': 'status es requerido',
      'any.only': 'status debe ser uno de los valores permitidos: SUCCESS, FAILED, IN_PROGRESS',
    }),

  timestamp: Joi.string()
    .isoDate()
    .required()
    .custom((value, helpers) => {
      const parsed = new Date(value).getTime();
      if (parsed > Date.now()) {
        return helpers.error('date.future');
      }
      return value;
    })
    .messages({
      'any.required': 'timestamp es requerido',
      'string.empty': 'timestamp no puede estar vacío',
      'string.isoDate': 'timestamp debe ser una fecha en formato ISO 8601 válida',
      'date.future': 'timestamp no puede ser una fecha futura',
    }),

  duration_seconds: Joi.number()
    .integer()
    .min(0)
    .max(86400)
    .required()
    .messages({
      'any.required': 'duration_seconds es requerido',
      'number.base': 'duration_seconds debe ser un número',
      'number.integer': 'duration_seconds debe ser un número entero',
      'number.min': 'duration_seconds no puede ser negativo',
      'number.max': 'duration_seconds no puede superar 86400 segundos (24 horas)',
    }),

  deployed_by: Joi.string()
    .trim()
    .min(3)
    .max(150)
    .required()
    .messages({
      'any.required': 'deployed_by es requerido',
      'string.empty': 'deployed_by no puede estar vacío',
      'string.min': 'deployed_by debe tener al menos 3 caracteres',
      'string.max': 'deployed_by no puede superar los 150 caracteres',
    }),

  environment: Joi.string()
    .valid('production', 'staging', 'development')
    .required()
    .messages({
      'any.required': 'environment es requerido',
      'any.only': 'environment debe ser uno de los valores permitidos: production, staging, development',
    }),

  description: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .messages({
      'string.empty': 'description, si se provee, debe tener al menos 1 carácter',
      'string.min': 'description debe tener al menos 1 carácter',
      'string.max': 'description no puede superar los 500 caracteres',
    }),
});

const validateDeployment = (req, res, next) => {
  const { error, value } = deploymentSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.context && detail.context.key ? detail.context.key : 'unknown',
      message: detail.message.replace(/"/g, ''),
    }));

    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  req.body = value;
  return next();
};

module.exports = {
  deploymentSchema,
  validateDeployment,
};