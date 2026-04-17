const { body, param, query } = require('express-validator');

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;

const validateCreateGreeting = [
  body('countryCode')
    .exists({ checkFalsy: true })
    .withMessage('El código de país es requerido')
    .toUpperCase()
    .matches(COUNTRY_CODE_REGEX)
    .withMessage('El código de país debe tener exactamente 2 letras ISO 3166-1 alpha-2'),

  body('countryName')
    .exists({ checkFalsy: true })
    .withMessage('El nombre del país es requerido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del país debe tener entre 2 y 100 caracteres')
    .escape(),

  body('language')
    .exists({ checkFalsy: true })
    .withMessage('El idioma es requerido')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El idioma debe tener entre 2 y 50 caracteres')
    .escape(),

  body('greeting')
    .exists({ checkFalsy: true })
    .withMessage('El saludo es requerido')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El saludo debe tener entre 1 y 200 caracteres')
    .escape(),

  body('formalGreeting')
    .optional({ nullable: true })
    .isString()
    .withMessage('El saludo formal debe ser una cadena de texto')
    .trim()
    .isLength({ max: 200 })
    .withMessage('El saludo formal no puede superar los 200 caracteres')
    .escape(),

  body('flagUrl')
    .exists({ checkFalsy: true })
    .withMessage('La URL de la bandera es requerida')
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('La URL de la bandera debe ser una URL HTTPS válida. Solo se aceptan URLs HTTPS')
    .isLength({ max: 500 })
    .withMessage('La URL de la bandera no puede superar los 500 caracteres'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('El campo isActive debe ser un valor booleano')
    .toBoolean(),
];

const validateUpdateGreeting = [
  param('id')
    .isMongoId()
    .withMessage('El ID proporcionado no tiene formato válido de MongoDB ObjectId'),

  body('countryCode')
    .optional({ nullable: true })
    .toUpperCase()
    .matches(COUNTRY_CODE_REGEX)
    .withMessage('El código de país debe tener exactamente 2 letras ISO 3166-1 alpha-2'),

  body('countryName')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del país debe tener entre 2 y 100 caracteres')
    .escape(),

  body('language')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El idioma debe tener entre 2 y 50 caracteres')
    .escape(),

  body('greeting')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El saludo debe tener entre 1 y 200 caracteres')
    .escape(),

  body('formalGreeting')
    .optional({ nullable: true })
    .isString()
    .withMessage('El saludo formal debe ser una cadena de texto')
    .trim()
    .isLength({ max: 200 })
    .withMessage('El saludo formal no puede superar los 200 caracteres')
    .escape(),

  body('flagUrl')
    .optional({ nullable: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('La URL de la bandera debe ser una URL HTTPS válida. Solo se aceptan URLs HTTPS')
    .isLength({ max: 500 })
    .withMessage('La URL de la bandera no puede superar los 500 caracteres'),

  body('isActive')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('El campo isActive debe ser un valor booleano')
    .toBoolean(),
];

const validateGetByCountryCode = [
  param('countryCode')
    .exists({ checkFalsy: true })
    .withMessage('El código de país es requerido')
    .toUpperCase()
    .matches(COUNTRY_CODE_REGEX)
    .withMessage('El código de país debe tener exactamente 2 letras ISO 3166-1 alpha-2'),
];

const validateDeleteGreeting = [
  param('id')
    .isMongoId()
    .withMessage('El ID proporcionado no tiene formato válido de MongoDB ObjectId'),
];

const validateListGreetings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El parámetro page debe ser un entero positivo mayor o igual a 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El parámetro limit debe ser un entero entre 1 y 100')
    .toInt(),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('El parámetro isActive debe ser un valor booleano ("true" o "false")')
    .toBoolean(),
];

module.exports = {
  validateCreateGreeting,
  validateUpdateGreeting,
  validateGetByCountryCode,
  validateDeleteGreeting,
  validateListGreetings,
};