const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./logger');
const router = require('../routes/index');
const { swaggerSpec, swaggerUi } = require('./swagger');

const app = express();

// ─── Helmet ───────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS;

if (!rawOrigins) {
  logger.warn(
    'ALLOWED_ORIGINS no está definida. CORS operará en modo restrictivo: todos los orígenes serán rechazados.'
  );
}

const whitelist = rawOrigins
  ? rawOrigins.split(',').map((origin) => origin.trim())
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origen no permitido — ${origin}`));
    }
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
};

app.use(cors(corsOptions));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message:
      'Demasiadas solicitudes desde esta IP. Por favor, intente nuevamente después de 15 minutos.',
  },
});

app.use(limiter);

// ─── Morgan + Winston Stream ──────────────────────────────────────────────────
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

app.use(morgan('combined', { stream: morganStream }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── Rutas de API ─────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Documentación Swagger ────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── 404 — Rutas No Encontradas ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'not found',
    message: `La ruta ${req.method} ${req.originalUrl} no existe en este servidor.`,
  });
});

// ─── Error Handler Global ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  logger.error(`${err.message} — Stack: ${err.stack}`);

  const response = {
    status: 'error',
    message: err.message || 'Error interno del servidor.',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

module.exports = app;