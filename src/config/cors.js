const cors = require('cors');

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS;

  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const parseAllowedHeaders = () => {
  const baseHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'];

  const extraRaw = process.env.CORS_ALLOWED_HEADERS;

  if (!extraRaw) {
    return baseHeaders;
  }

  const extraHeaders = extraRaw
    .split(',')
    .map((header) => header.trim())
    .filter((header) => header.length > 0);

  const merged = [...new Set([...baseHeaders, ...extraHeaders])];

  return merged;
};

const allowedOrigins = parseAllowedOrigins();
const allowedHeaders = parseAllowedHeaders();

const originValidator = (origin, callback) => {
  // Permitir peticiones sin header Origin: same-origin, Postman, curl, etc.
  // Estos clientes no envían Origin y son legítimos fuera del contexto browser cross-origin
  if (origin === undefined || origin === null) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // En development se loguea el rechazo para facilitar debugging local
  // En producción el logging lo gestiona winston, no console directamente
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[CORS] Origen rechazado: ${origin}`);
  }

  // El mensaje no expone la lista de orígenes permitidos por seguridad
  return callback(new Error(`CORS: el origen '${origin}' no está autorizado para acceder a este recurso`));
};

const corsOptions = {
  origin: originValidator,

  // TRACE y CONNECT excluidos por razones de seguridad (TRACE puede facilitar XST attacks)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: allowedHeaders,

  // Headers expuestos para que el cliente pueda gestionar el rate limiting correctamente
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],

  // Necesario para que JWT en Authorization header y cookies funcionen en peticiones cross-origin
  credentials: true,

  // Cachear preflight 24h para reducir peticiones OPTIONS innecesarias
  maxAge: 86400,

  // 200 en lugar de 204 por compatibilidad con IE11 y clientes legacy
  optionsSuccessStatus: 200,
};

const corsMiddleware = cors(corsOptions);

// Default export: middleware instanciado listo para app.use()
module.exports = corsMiddleware;

// Named export: objeto de opciones para tests unitarios sin levantar servidor
module.exports.corsOptions = corsOptions;