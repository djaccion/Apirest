// XP-9: Configuración base de la aplicación Express - Metodología Híbrida
// Este archivo forma parte de la capa de configuración según arquitectura RESTful MVC simplificado.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import rateLimiter from '../middlewares/rateLimiter.js';
import errorHandler from '../middlewares/errorHandler.js';
import apiRouter from '../routes/index.js';
import { swaggerUi, swaggerSpec } from '../docs/swagger.js';
import { morganStream } from '../utils/logger.js';

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim());

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';

const app = express();

// 1. Helmet - seguridad HTTP con headers por defecto
app.use(helmet());

// 2. CORS - orígenes permitidos y preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. Rate Limiter - protección DoS/DDoS
app.use(rateLimiter);

// 4. Morgan - access logs HTTP redirigidos a winston
app.use(morgan(morganFormat, { stream: morganStream }));

// 5. express.json - parseo de body JSON con límite de 10kb
app.use(express.json({ limit: '10kb' }));

// 6. express.urlencoded - parseo de body URL-encoded con límite de 10kb
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Montaje de rutas principales
app.use('/api/v1', apiRouter);

// Montaje de documentación Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Manejador global de errores - debe ser el último middleware
app.use(errorHandler);

export default app;