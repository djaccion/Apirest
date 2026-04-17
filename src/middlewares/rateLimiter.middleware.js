const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// NOTE: En ambientes de producción con múltiples instancias se debe reemplazar
// el store por defecto por un store externo como Redis usando el paquete rate-limit-redis.

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too Many Requests',
    message:
      'Has superado el límite de solicitudes permitidas. Por favor, intenta nuevamente más tarde.',
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      message: 'Rate limit exceeded',
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => req.ip,
  skip: (req) => false,
});

module.exports = limiter;