const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB, 10) || 0;
const REDIS_TTL = parseInt(process.env.REDIS_TTL_SECONDS, 10) || 300;

const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: REDIS_DB,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 10) {
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  enableReadyCheck: true,
  connectTimeout: 10000,
};

if (REDIS_PASSWORD && REDIS_PASSWORD.trim() !== '') {
  redisOptions.password = REDIS_PASSWORD;
}

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => {
  console.log(`[Redis] Conexión establecida con ${REDIS_HOST}:${REDIS_PORT}`);
});

redisClient.on('ready', () => {
  console.log('[Redis] Cliente listo para recibir comandos.');
});

redisClient.on('error', (err) => {
  console.error(`[Redis] Error en el cliente: ${err.message}`);
});

redisClient.on('close', () => {
  console.warn('[Redis] La conexión a Redis fue cerrada.');
});

redisClient.on('reconnecting', () => {
  console.log('[Redis] Intentando reconectar a Redis...');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error(`[Redis] Falló la conexión inicial a Redis: ${err.message}`);
  }
};

const disconnectRedis = async () => {
  try {
    await redisClient.quit();
  } catch (err) {
    console.error(`[Redis] Error al cerrar la conexión a Redis: ${err.message}`);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
  REDIS_TTL,
};