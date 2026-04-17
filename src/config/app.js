const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('../middlewares/rateLimiter');
const morgan = require('morgan');
const router = require('../routes');
const { swaggerUi, specs } = require('./swagger');
const errorHandler = require('../middlewares/errorHandler');
const config = require('./env');

const app = express();

// En producción se debe configurar la Content Security Policy de forma explícita según los dominios permitidos.
app.use(helmet());

const allowedOrigins = config.CORS_ORIGINS
  ? config.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : false;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(rateLimiter);

// En iteraciones futuras el stream de morgan se conectará al logger de winston para unificar la salida de logs.
const morganFormat = config.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

const apiPrefix = config.API_PREFIX || '/api/v1';
app.use(apiPrefix, router);

// Este endpoint debe protegerse o deshabilitarse en ambiente de producción en iteraciones futuras.
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(errorHandler);

module.exports = app;