const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const router = require('./routes/index.js');
const errorHandler = require('./middlewares/errorHandler.js');
const notFound = require('./middlewares/notFound.js');

// Variables de entorno utilizadas en este archivo:
// NODE_ENV: define el entorno de ejecución (development, staging, production)
// FRONTEND_URL: origen permitido para CORS y Content Security Policy

if (!process.env.FRONTEND_URL) {
  throw new Error(
    'Variable de entorno FRONTEND_URL no definida. El servidor no puede iniciarse sin un origen CORS configurado.'
  );
}

const FRONTEND_URL = process.env.FRONTEND_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// --- CONFIGURACIÓN DE HELMET ---
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", FRONTEND_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
});

// --- CONFIGURACIÓN DE CORS ---
const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// --- CONFIGURACIÓN DE RATE LIMITING ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'Demasiadas solicitudes desde esta IP. Por favor, intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Demasiados intentos de autenticación desde esta IP. Por favor, intente nuevamente en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- REGISTRO DE MIDDLEWARES GLOBALES (orden crítico para seguridad) ---

// 1. Helmet - headers de seguridad HTTP
app.use(helmetConfig);

// 2. CORS - configuración restrictiva + preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. Morgan - logging de requests según entorno
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// 4. Body parsers con límite de 10kb para prevenir ataques de payload masivo
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// 5. Sanitización contra NoSQL injection
app.use(mongoSanitize());

// 6. Sanitización contra XSS
app.use(xss());

// 7. Rate limiter general para todas las rutas /api/
app.use('/api/', generalLimiter);

// 8. Rate limiter estricto exclusivamente para rutas de autenticación
app.use('/api/auth/', authLimiter);

// --- REGISTRO DE RUTAS ---

// Health check endpoint - responde directamente sin pasar por el router principal
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Router principal montado en /api
app.use('/api', router);

// --- MANEJO DE ERRORES ---

// 1. Middleware para rutas no encontradas (404)
app.use(notFound);

// 2. Middleware global de manejo de errores (debe ser el último)
app.use(errorHandler);

module.exports = app;