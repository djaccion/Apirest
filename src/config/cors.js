const logger = require('../utils/logger');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

logger.info('CORS: Orígenes permitidos registrados', {
  origins: allowedOrigins,
  count: allowedOrigins.length,
  environment: process.env.NODE_ENV || 'development',
});

const originValidator = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // ADVERTENCIA DE SEGURIDAD: En entorno de desarrollo se permite cualquier origen
  // para facilitar el trabajo local. NUNCA habilitar este comportamiento en producción.
  if (process.env.NODE_ENV === 'development') {
    logger.warn('CORS: Origen no registrado permitido en modo desarrollo', {
      origin,
      warning: 'Este comportamiento NO debe replicarse en producción',
    });
    return callback(null, true);
  }

  logger.warn('CORS: Solicitud bloqueada por política de origen cruzado', {
    origin,
    allowedOrigins,
  });

  return callback(
    new Error(
      `CORS: El origen '${origin}' no está autorizado por la política de seguridad de esta aplicación. ` +
        `Si necesitas acceso, contacta al administrador para agregar tu origen a ALLOWED_ORIGINS.`
    )
  );
};

const corsOptions = {
  origin: originValidator,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],

  exposedHeaders: ['X-Request-ID'],

  // Habilita el envío de cookies y headers de autorización en requests cross-origin
  credentials: true,

  // Se usa 200 en lugar del default 204 por compatibilidad con navegadores legacy (IE11)
  optionsSuccessStatus: 200,

  // Tiempo en segundos que el navegador puede cachear la respuesta preflight (24 horas)
  maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 86400,
};

module.exports = corsOptions;