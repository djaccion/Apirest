const rateLimit = require('express-rate-limit');

/**
 * @module rateLimiter.middleware
 * @description Middleware de limitación de tasa de peticiones HTTP para proteger la API
 * contra ataques de fuerza bruta, DDoS y abuso de endpoints.
 *
 * Exporta tres instancias diferenciadas:
 * - authLimiter: Para el endpoint de autenticación POST /api/v1/auth/login
 * - generalLimiter: Para todos los endpoints de la API como capa base de protección
 * - syncLimiter: Para el endpoint costoso POST /api/v1/sync/users
 *
 * @prerequisite El archivo principal app.js debe tener configurado `app.set('trust proxy', 1)`
 * para que req.ip resuelva correctamente la IP real del cliente cuando la aplicación
 * corre detrás de un reverse proxy (Nginx, Kubernetes Ingress, etc.).
 *
 * TODO: En entornos multi-instancia (múltiples pods/contenedores), reemplazar el store
 * en memoria por `rate-limit-redis` usando la instancia de Redis ya configurada en
 * src/config/redis.js para compartir contadores entre instancias y garantizar
 * consistencia del rate limiting distribuido.
 */

// ─── Constantes de configuración ────────────────────────────────────────────
// Los valores son configuración de seguridad fija definida por el equipo,
// no se leen desde variables de entorno para garantizar consistencia.

const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutos en milisegundos
const AUTH_MAX_REQUESTS = 10;

const GENERAL_WINDOW_MS = 1 * 60 * 1000; // 1 minuto en milisegundos
const GENERAL_MAX_REQUESTS = 100;

const SYNC_WINDOW_MS = 60 * 60 * 1000; // 1 hora en milisegundos
const SYNC_MAX_REQUESTS = 5;

// ─── authLimiter ─────────────────────────────────────────────────────────────
// Destinado exclusivamente al endpoint POST /api/v1/auth/login
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX_REQUESTS,

  // skipFailedRequests: false — Los intentos fallidos de login también cuentan
  // contra el límite. Esto es crítico para prevenir ataques de fuerza bruta:
  // si solo se contaran los exitosos, un atacante podría hacer intentos ilimitados
  // de credenciales incorrectas sin ser bloqueado.
  skipFailedRequests: false,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.ip,

  handler: (req, res, next, options) => {
    res.status(429).json({
      status: 429,
      error: 'Has superado el límite de intentos de autenticación. Por favor, inténtalo de nuevo más tarde.',
      retryAfter: 'Reintenta después de 15 minutos.',
    });
  },
});

// ─── generalLimiter ──────────────────────────────────────────────────────────
// Destinado a todos los endpoints de la API como capa base de protección global
const generalLimiter = rateLimit({
  windowMs: GENERAL_WINDOW_MS,
  max: GENERAL_MAX_REQUESTS,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.ip,

  handler: (req, res, next, options) => {
    res.status(429).json({
      status: 429,
      error: 'Demasiadas peticiones realizadas desde esta IP. Por favor, reduce la frecuencia de tus solicitudes.',
      retryAfter: 'Reintenta en 1 minuto.',
    });
  },
});

// ─── syncLimiter ─────────────────────────────────────────────────────────────
// Destinado al endpoint POST /api/v1/sync/users, operación costosa en recursos
const syncLimiter = rateLimit({
  windowMs: SYNC_WINDOW_MS,
  max: SYNC_MAX_REQUESTS,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.ip,

  handler: (req, res, next, options) => {
    res.status(429).json({
      status: 429,
      error: 'Has alcanzado el límite de sincronizaciones permitidas. Por favor, espera antes de volver a sincronizar.',
      retryAfter: 'Reintenta en 1 hora.',
    });
  },
});

module.exports = {
  authLimiter,
  generalLimiter,
  syncLimiter,
};