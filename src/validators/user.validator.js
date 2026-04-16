const Joi = require('joi');

const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .trim()
    .disallow(null)
    .required(),
  email: Joi.string()
    .email({ tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .disallow(null)
    .required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    .disallow(null)
    .required(),
  role: Joi.string()
    .valid('admin', 'user')
    .disallow(null)
    .required(),
}).options({ allowUnknown: false, stripUnknown: false });

const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .trim()
    .disallow(null)
    .optional(),
  email: Joi.string()
    .email({ tlds: { allow: true } })
    .max(255)
    .lowercase()
    .trim()
    .disallow(null)
    .optional(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/)
    .disallow(null)
    .optional(),
  role: Joi.string()
    .valid('admin', 'user')
    .disallow(null)
    .optional(),
}).min(1).options({ allowUnknown: false, stripUnknown: false });

const userIdParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required(),
});

/**
 * @function validateCreateUser
 * @description Middleware que valida req.body contra el esquema de creación de usuario.
 * Verifica que username, email, password y role cumplan todas las reglas de formato y complejidad.
 * Usa req.body como fuente de datos.
 * @returns {void} En caso de error retorna HTTP 400 con { success: false, errors: string[] }.
 * Si pasa la validación llama a next() y asigna el valor sanitizado a req.body.
 */
const validateCreateUser = (req, res, next) => {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message.replace(/"/g, ''));
    return res.status(400).json({ success: false, errors });
  }

  req.body = value;
  return next();
};

/**
 * @function validateUpdateUser
 * @description Middleware que valida req.body contra el esquema de actualización de usuario.
 * Todos los campos son opcionales pero al menos uno debe estar presente.
 * El campo password sigue las mismas reglas de complejidad que en la creación.
 * Usa req.body como fuente de datos.
 * @returns {void} En caso de error retorna HTTP 400 con { success: false, errors: string[] }.
 * Si pasa la validación llama a next() y asigna el valor sanitizado a req.body.
 */
const validateUpdateUser = (req, res, next) => {
  const { error, value } = updateUserSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message.replace(/"/g, ''));
    return res.status(400).json({ success: false, errors });
  }

  req.body = value;
  return next();
};

/**
 * @function validateUserIdParam
 * @description Middleware que valida req.params contra el esquema de parámetro de ID de usuario.
 * Verifica que el parámetro id sea un entero positivo mayor a cero.
 * Convierte el id de string a número entero para las capas posteriores.
 * Usa req.params como fuente de datos.
 * @returns {void} En caso de error retorna HTTP 400 con { success: false, errors: string[] }.
 * Si pasa la validación llama a next() y asigna el valor convertido a req.params.
 */
const validateUserIdParam = (req, res, next) => {
  const { error, value } = userIdParamSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message.replace(/"/g, ''));
    return res.status(400).json({ success: false, errors });
  }

  req.params = value;
  return next();
};

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUserIdParam,
};