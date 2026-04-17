require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const connectDB = require('./config/database');
const greetingsRouter = require('./routes/greetings');
const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV;
const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  if (NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'];
    if (proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", FRONTEND_URL],
    },
  },
  hsts: NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
};

const corsOptions = {
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: 'Demasiadas peticiones desde esta IP. Por favor, intente de nuevo después de 15 minutos.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: 'Demasiados intentos de autenticación desde esta IP. Por favor, intente de nuevo después de 15 minutos.',
  },
});

app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/health', healthRouter);
app.use('/api/greetings', greetingsRouter);
app.use('/api/auth', authRouter);

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Ruta no encontrada.',
    path: NODE_ENV === 'development' ? req.originalUrl : undefined,
  });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production' && status === 500
    ? 'Error interno del servidor.'
    : err.message || 'Error interno del servidor.';

  res.status(status).json({
    status,
    message,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en modo ${NODE_ENV} en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;