const cors = require('cors');

/**
 * Configuración centralizada del middleware CORS.
 * Consume la variable de entorno ALLOWED_ORIGINS para construir
 * una whitelist restrictiva de dominios permitidos.
 * Variable de entorno: ALLOWED_ORIGINS (dominios separados por coma)
 * JIRA: XP-9
 */

const whitelist = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [];

function validateOrigin(origin, callback) {
  if (origin === undefined || origin === null) {
    return callback(null, true);
  }

  if (whitelist.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error('CORS: Origen no permitido'));
}

const corsOptions = {
  origin: validateOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length'],
  credentials: true,
  maxAge: 600,
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);