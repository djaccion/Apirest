const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const deploymentRouter = require('./routes/deployment.routes');
const metricsRouter = require('./routes/metrics.routes');
const syncRouter = require('./routes/sync.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const loggerMiddleware = require('./middlewares/logger.middleware');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  message: {
    message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente más tarde.'
  }
});

app.use(limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(loggerMiddleware);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/deployments', deploymentRouter);
app.use('/api/v1/metrics', metricsRouter);
app.use('/api/v1/sync', syncRouter);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'El recurso solicitado no fue encontrado.',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  errorMiddleware(err, req, res, next);
});

module.exports = app;