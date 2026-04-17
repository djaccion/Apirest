const { body, validationResult } = require('express-validator');

const loginValidationRules = [
  body('username')
    .exists({ checkFalsy: true })
    .withMessage('El nombre de usuario es requerido')
    .isString()
    .withMessage('El nombre de usuario debe ser una cadena de texto')
    .trim()
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede superar los 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
    .escape(),

  body('password')
    .exists({ checkFalsy: true })
    .withMessage('La contraseña es requerida')
    .isString()
    .withMessage('La contraseña debe ser una cadena de texto')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .isLength({ max: 128 })
    .withMessage('La contraseña no puede superar los 128 caracteres'),
    // NOTA DE SEGURIDAD: No se aplica escape() ni ninguna sanitización adicional sobre la contraseña.
    // Esto es una decisión de diseño deliberada: sanitizar la contraseña alteraría su valor antes
    // de compararlo con el hash almacenado en bcrypt, rompiendo el proceso de autenticación.
    // No "corrijas" esto sin entender las implicaciones.
];

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(422).json({
    success: false,
    message: 'Datos de entrada inválidos',
    errors: result.array(),
  });
};

module.exports = {
  loginValidationRules,
  handleValidationErrors,
};