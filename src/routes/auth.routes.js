const { Router } = require('express');
const { login } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validators/auth.validator');
const { authRateLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * @module AuthRoutes
 * @description Enrutador del dominio de autenticación.
 * @baseRoute /api/v1/auth
 * @endpoints
 *   POST /login - Autentica las credenciales del usuario y retorna un token JWT.
 */

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), login);

module.exports = router;