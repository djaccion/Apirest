const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/verifyToken');

const authRateLimiter = rateLimit({
  windowMs: (process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX || 10,
  message: {
    message: 'Demasiados intentos desde esta IP, por favor intente nuevamente después de 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const loginValidations = [
  body('username')
    .exists({ checkFalsy: true })
    .withMessage('El campo username es requerido')
    .isString()
    .withMessage('El campo username debe ser una cadena de texto')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El campo username debe tener entre 3 y 50 caracteres'),

  body('password')
    .exists({ checkFalsy: true })
    .withMessage('El campo password es requerido')
    .isString()
    .withMessage('El campo password debe ser una cadena de texto')
    .isLength({ min: 8, max: 128 })
    .withMessage('El campo password debe tener entre 8 y 128 caracteres')
];

const router = Router();

router.post('/login', authRateLimiter, loginValidations, authController.login);

router.post('/logout', verifyToken, authController.logout);

router.post('/refresh-token', authRateLimiter, authController.refreshToken);

module.exports = router;