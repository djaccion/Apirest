const { rateLimit } = require('express-rate-limit');
const logger = require('./logger');

// TODO: En iteraciones futuras, reemplazar el store en memoria por defecto por `rate-limit-redis`
// para soportar múltiples instancias del servidor en ambientes distribuidos o con escalado horizontal.
// Ejemplo: const RedisStore = require('rate-limit-redis'); store: new RedisStore({ ... })

// NOTA: En ambientes con proxy reverso (nginx, load balancer) se deberá configurar
// `app.set('trust proxy', 1)` en el servidor principal para que `req.ip` resuelva
// correctamente la IP real del cliente.

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000;
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;
const AUTH_WINDOW_MS = parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 10) || 900000;
const AUTH_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || 10;

/**
 * @description Limitador general de peticiones aplicable a todas las rutas de la API como middleware global.
 * Protege contra abuso general y ataques DoS limitando el número de peticiones por IP
 * dentro de una ventana de tiempo configurable.
 *
 * @middleware generalLimiter
 * @applies Aplicar en el servidor principal como middleware global antes de definir las rutas.
 *
 * @env {number} RATE_LIMIT_WINDOW_MS - Ventana de tiempo en milisegundos. Por defecto: 900000 (15 minutos).
 * @env {number} RATE_LIMIT_MAX_REQUESTS - Número máximo de peticiones por IP en la ventana. Por defecto: 100.
 */
const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: `Has superado el límite de peticiones permitidas. Por favor, inténtalo de nuevo más tarde.`,
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit general excedido', {
      ip: req.ip,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    res.status(options.message.status).json(options.message);
  },
});

/**
 * @description Limitador de peticiones específico para endpoints de autenticación sensibles
 * como login, refresh token o recuperación de contraseña.
 * Más restrictivo que el general para mitigar ataques de fuerza bruta.
 * Solo contabiliza intentos fallidos (respuestas con status >= 400), evitando
 * penalizar a usuarios legítimos que autentican correctamente.
 *
 * @middleware authLimiter
 * @applies Aplicar exclusivamente en rutas de autenticación: /auth/login, /auth/refresh, /auth/recover, etc.
 *
 * @env {number} RATE_LIMIT_AUTH_WINDOW_MS - Ventana de tiempo en milisegundos para auth. Por defecto: 900000 (15 minutos).
 * @env {number} RATE_LIMIT_AUTH_MAX_REQUESTS - Número máximo de intentos fallidos por IP en la ventana. Por defecto: 10.
 */
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Has superado el número máximo de intentos de autenticación. Por favor, inténtalo de nuevo más tarde.',
  },
  handler: (req, res, next, options) => {
    logger.warn('Posible intento de fuerza bruta detectado - Rate limit de autenticación excedido', {
      event: 'BRUTE_FORCE_ATTEMPT',
      ip: req.ip,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    res.status(options.message.status).json(options.message);
  },
});

module.exports = { generalLimiter, authLimiter };