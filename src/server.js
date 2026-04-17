'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const corsConfig = require('./config/cors');
const rateLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');
const router = require('./routes');
const swaggerSpec = require('./docs/swagger');
const logger = require('./utils/logger');

const { PAYLOAD_LIMIT = '10kb', NODE_ENV = 'development' } = process.env;

const app = express();

app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

app.use(helmet());

app.use(cors(corsConfig));

app.use(rateLimiter);

app.use(express.json({ limit: PAYLOAD_LIMIT }));

app.use(express.urlencoded({ extended: false, limit: PAYLOAD_LIMIT }));

morgan.token('request-id', (req) => req.requestId);

const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
const morganOptions = {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
};

if (NODE_ENV !== 'test') {
  app.use(morgan(morganFormat, morganOptions));
}

app.use('/api/v1', router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;