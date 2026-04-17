require('dotenv').config();
const rateLimit = require('express-rate-limit');

// XP-9: Ventana de tiempo en ms para el rate limiting (default: 15 minutos)
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000;

// XP-9: Máximo de requests permitidos por IP en la ventana de tiempo (default: 100)
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;

// XP-9: Entorno de ejecución para ajustar comportamiento del middleware
const NODE_ENV = process.env.NODE_ENV;

// XP-9: Configuración centralizada del middleware express-rate-limit
const rateLimitConfig = rateLimit({
  // Ventana de tiempo en milisegundos durante la cual se contabilizan los requests
  windowMs: WINDOW_MS,

  // Número máximo de requests permitidos por IP dentro de la ventana definida
  max: MAX_REQUESTS,

  // Incluye headers estándar RateLimit-Limit, RateLimit-Remaining y RateLimit-Reset
  // para transparencia hacia el cliente sobre el estado de su cuota
  standardHeaders: true,

  // Deshabilita los headers deprecados X-RateLimit-* para evitar redundancia
  legacyHeaders: false,

  // Objeto de mensaje estructurado retornado cuando se supera el límite
  message: {
    status: 429,
    error: 'Too Many Requests',
    message:
      'Has superado el límite de requests permitidos. Por favor, intenta nuevamente más tarde.',
    retryAfter: 'Consulta el header Retry-After para saber cuándo puedes reintentar.',
  },

  // XP-9: Handler personalizado que detiene la cadena de middlewares al superar el límite
  handler: (req, res, next, options) => {
    // Establece el header Retry-After en segundos (windowMs / 1000)
    res.setHeader('Retry-After', Math.ceil(WINDOW_MS / 1000));

    // Responde con status 429 y el objeto message estructurado como JSON
    res.status(429).json(options.message);

    // No se llama a next() para detener la cadena de middlewares intencionalmente
  },

  // XP-9: Omite el rate limiting en entorno de test para no interferir con Jest/Supertest
  skip: (req) => {
    return NODE_ENV === 'test';
  },

  // XP-9: Generador de clave por cliente, considera proxies y balanceadores de carga
  keyGenerator: (req) => {
    // Usa X-Forwarded-For si existe (entornos detrás de proxy/load balancer),
    // tomando el primer valor de la lista; de lo contrario usa req.ip directamente
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    return req.ip;
  },
});

module.exports = rateLimitConfig;