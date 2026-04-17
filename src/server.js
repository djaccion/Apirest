const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} environment on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`, { code: error.code, port: PORT });
  } else if (error.code === 'EACCES') {
    logger.error(`Insufficient permissions to bind to port ${PORT}`, { code: error.code, port: PORT });
  } else {
    logger.error(`Server error: ${error.message}`, { code: error.code, port: PORT });
  }
  process.exit(1);
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));