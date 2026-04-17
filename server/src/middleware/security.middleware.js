const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const cors = require('cors');
const hpp = require('hpp');

const FRONTEND_URL = process.env.FRONTEND_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!FRONTEND_URL) {
  console.error(
    '[SECURITY WARNING] La variable de entorno FRONTEND_URL no está definida. ' +
    'La configuración de CORS puede ser insegura. Define FRONTEND_URL en tu archivo .env.'
  );
}

// ─── HELMET ──────────────────────────────────────────────────────────────────

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // unsafe-inline en styleSrc es necesario temporalmente para compatibilidad con
      // estilos en línea generados por algunas librerías de componentes React en desarrollo.
      // Evaluar migrar a nonces o hashes en producción para eliminar esta excepción.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", FRONTEND_URL].filter(Boolean),
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      ...(NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
    },
  },
  hsts: NODE_ENV === 'production'
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  permittedCrossDomainPolicies: false,
});

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!FRONTEND_URL) {
      return callback(
        new Error(
          'CORS rechazado: FRONTEND_URL no está configurada en las variables de entorno. ' +
          'No es posible validar el origen de la petición.'
        )
      );
    }

    if (origin === FRONTEND_URL) {
      return callback(null, true);
    }

    return callback(
      new Error(
        `CORS rechazado: El origen "${origin}" no está autorizado. ` +
        `Solo se permite el origen "${FRONTEND_URL}".`
      )
    );
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400,
};

const corsMiddleware = cors(corsOptions);

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message:
      'Demasiadas peticiones desde esta IP. Por favor, inténtalo de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message:
      'Acceso bloqueado temporalmente debido a demasiados intentos de autenticación fallidos. ' +
      'Por favor, inténtalo de nuevo en 15 minutos.',
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    status: 429,
    message:
      'Has excedido el límite de peticiones a la API pública. Por favor, inténtalo de nuevo en 1 minuto.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── MONGO SANITIZE ───────────────────────────────────────────────────────────

const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [SECURITY WARNING] Intento de inyección NoSQL detectado y sanitizado. ` +
      `Ruta: ${req.path} | Campo afectado: ${key}`
    );
  },
});

// ─── XSS CLEAN ────────────────────────────────────────────────────────────────

const xssCleanMiddleware = xssClean();

// ─── HPP ──────────────────────────────────────────────────────────────────────

// whitelist vacío por defecto.
// Si en el futuro algún endpoint necesita parámetros duplicados legítimos
// (por ejemplo, filtros múltiples como ?tag=a&tag=b), agregar el nombre
// del parámetro explícitamente en este array.
const hppMiddleware = hpp({
  whitelist: [],
});

// ─── REQUEST SANITIZER PERSONALIZADO ─────────────────────────────────────────

const INJECTION_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on(?:click|load|error|mouseover|mouseout|focus|blur|change|submit|keydown|keyup|keypress|input|dblclick|contextmenu|drag|drop|scroll|resize|select|copy|cut|paste|wheel|touchstart|touchend|touchmove|pointerdown|pointerup|pointermove)\s*=/i,
  /vbscript:/i,
  /data:text\/html/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /expression\s*\(/i,
];

function containsSuspiciousPattern(value) {
  if (typeof value !== 'string') return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

function scanObject(obj) {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && containsSuspiciousPattern(value)) {
      return true;
    }
    if (typeof value === 'object' && value !== null && scanObject(value)) {
      return true;
    }
  }

  return false;
}

function requestSanitizer(req, res, next) {
  const sources = [req.body, req.params, req.query];

  for (const source of sources) {
    if (scanObject(source)) {
      const timestamp = new Date().toISOString();
      console.warn(
        `[${timestamp}] [SECURITY WARNING] Patrón de inyección sospechoso detectado en la petición. ` +
        `Método: ${req.method} | Ruta: ${req.path} | IP: ${req.ip}`
      );

      return res.status(400).json({
        status: 400,
        message:
          'La petición contiene contenido no permitido. Por favor, revisa los datos enviados.',
      });
    }
  }

  next();
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  helmetConfig,
  corsMiddleware,
  generalLimiter,
  authLimiter,
  apiLimiter,
  mongoSanitizeMiddleware,
  xssCleanMiddleware,
  hppMiddleware,
  requestSanitizer,
};