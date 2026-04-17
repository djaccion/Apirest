require('dotenv').config();

const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info('Server started', {
    environment: process.env.NODE_ENV,
    port: PORT,
    url: `http://localhost:${PORT}`,
    docs: `http://localhost:${PORT}/api-docs`,
  });
});

process.on('SIGTERM', () => {
  logger.warn('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    logger.info('Server closed successfully.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.warn('SIGINT received. Starting graceful shutdown...');
  server.close(() => {
    logger.info('Server closed successfully.');
    process.exit(0);
  });
});