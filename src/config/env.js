'use strict';

const dotenv = require('dotenv');

dotenv.config();

const parseIntEnv = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolEnv = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  return value === 'true';
};

const nodeEnv = process.env.NODE_ENV || 'development';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    'Missing required environment variable: JWT_SECRET must be defined and non-empty'
  );
}

const bcryptSaltRounds = parseIntEnv(process.env.BCRYPT_SALT_ROUNDS, 12);

if (nodeEnv === 'production' && bcryptSaltRounds < 12) {
  throw new Error(
    `Invalid value for environment variable BCRYPT_SALT_ROUNDS: received ${bcryptSaltRounds}, must be >= 12 in production`
  );
}

const serverPort = parseIntEnv(process.env.PORT, 3000);

const validateConfig = (config) => {
  const validNodeEnvs = ['development', 'test', 'production'];
  if (!validNodeEnvs.includes(config.server.nodeEnv)) {
    throw new Error(
      `Invalid value for environment variable NODE_ENV: received '${config.server.nodeEnv}', must be one of: ${validNodeEnvs.join(', ')}`
    );
  }

  if (!Number.isInteger(config.server.port) || config.server.port <= 0) {
    throw new Error(
      `Invalid value for environment variable PORT: received '${process.env.PORT}', must be a positive integer`
    );
  }

  if (!config.jwt.secret || config.jwt.secret.trim() === '') {
    throw new Error(
      'Missing required environment variable: JWT_SECRET must be defined and non-empty'
    );
  }

  if (
    config.server.nodeEnv === 'production' &&
    config.bcrypt.saltRounds < 12
  ) {
    throw new Error(
      `Invalid value for environment variable BCRYPT_SALT_ROUNDS: received ${config.bcrypt.saltRounds}, must be >= 12 in production`
    );
  }
};

const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

const redisPassword = process.env.REDIS_PASSWORD !== undefined && process.env.REDIS_PASSWORD !== ''
  ? process.env.REDIS_PASSWORD
  : undefined;

const config = Object.freeze({
  server: Object.freeze({
    port: serverPort,
    nodeEnv: nodeEnv,
    apiVersion: process.env.API_VERSION || 'v1',
  }),

  database: Object.freeze({
    path: nodeEnv === 'test' ? ':memory:' : (process.env.DB_PATH || './data/database.sqlite'),
    inMemory: nodeEnv === 'test',
  }),

  jwt: Object.freeze({
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    algorithm: 'HS256',
  }),

  bcrypt: Object.freeze({
    saltRounds: bcryptSaltRounds,
  }),

  redis: Object.freeze({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseIntEnv(process.env.REDIS_PORT, 6379),
    password: redisPassword,
    ttl: parseIntEnv(process.env.REDIS_TTL_SECONDS, 300),
    enabled: parseBoolEnv(process.env.REDIS_ENABLED, true),
  }),

  rabbitmq: Object.freeze({
    url: process.env.RABBITMQ_URL || 'amqp://localhost',
    exchange: process.env.RABBITMQ_EXCHANGE || 'users.events',
    queue: process.env.RABBITMQ_QUEUE || 'users.sync',
    enabled: parseBoolEnv(process.env.RABBITMQ_ENABLED, true),
  }),

  rateLimit: Object.freeze({
    windowMs: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 900000),
    max: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  }),

  cors: Object.freeze({
    allowedOrigins: Object.freeze(corsAllowedOrigins),
  }),

  logging: Object.freeze({
    level: process.env.LOG_LEVEL || 'info',
  }),
});

validateConfig(config);

module.exports = config;