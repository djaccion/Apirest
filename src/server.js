require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeDatabase, closeDatabase } = require('./db/database');
const { initializeRedis, closeRedis } = require('./cache/redis');
const { initializeRabbitMQ, closeRabbitMQ } = require('./events/rabbitmq');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = http.createServer(app);

async function start() {
  try {
    await initializeDatabase();
    console.log('[DB] SQLite connection established and migrations applied.');
  } catch (err) {
    console.error('[DB] Fatal: Failed to initialize SQLite database.', err);
    process.exit(1);
  }

  try {
    await initializeRedis();
    console.log('[Redis] Connection established.');
  } catch (err) {
    console.error('[Redis] Warning: Failed to connect to Redis. Running without cache.', err);
  }

  try {
    await initializeRabbitMQ();
    console.log('[RabbitMQ] Connection and channel established.');
  } catch (err) {
    console.error('[RabbitMQ] Warning: Failed to connect to RabbitMQ. Events will not be published.', err);
  }

  server.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} | ENV: ${NODE_ENV}`);
  });
}

async function shutdown(signal) {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error('[Server] Error closing HTTP server.', err);
    } else {
      console.log('[Server] HTTP server closed. No longer accepting connections.');
    }

    try {
      await closeRabbitMQ();
      console.log('[RabbitMQ] Connection closed.');
    } catch (rabbitErr) {
      console.error('[RabbitMQ] Error closing connection.', rabbitErr);
    }

    try {
      await closeRedis();
      console.log('[Redis] Connection closed.');
    } catch (redisErr) {
      console.error('[Redis] Error closing connection.', redisErr);
    }

    try {
      await closeDatabase();
      console.log('[DB] SQLite connection closed.');
    } catch (dbErr) {
      console.error('[DB] Error closing SQLite connection.', dbErr);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception. Shutting down.', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled Rejection. Shutting down.', reason);
  process.exit(1);
});

start().catch((err) => {
  console.error('[Server] Fatal error during startup.', err);
  process.exit(1);
});

module.exports = server;