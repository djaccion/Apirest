const redisClient = require('../config/redis');
const logger = require('../config/logger');

const USER_KEY_PREFIX = 'user:';
const USERS_ALL_KEY = 'users:all';
const USER_TTL = parseInt(process.env.CACHE_USER_TTL, 10) || 3600;
const USERS_LIST_TTL = parseInt(process.env.CACHE_USERS_LIST_TTL, 10) || 300;

const sanitizeUser = (userData) => {
  if (!userData || typeof userData !== 'object') return userData;
  const sanitized = { ...userData };
  delete sanitized.password;
  return sanitized;
};

const sanitizeUsers = (usersArray) => {
  if (!Array.isArray(usersArray)) return usersArray;
  return usersArray.map((user) => sanitizeUser(user));
};

const getUserById = async (id) => {
  try {
    const key = `${USER_KEY_PREFIX}${id}`;
    const cached = await redisClient.get(key);
    if (cached) {
      logger.debug(`[users.cache] Cache HIT - getUserById id=${id}`);
      return JSON.parse(cached);
    }
    logger.debug(`[users.cache] Cache MISS - getUserById id=${id}`);
    return null;
  } catch (error) {
    logger.error(`[users.cache] Error en getUserById id=${id}: ${error.message}`);
    return null;
  }
};

const setUserById = async (id, userData) => {
  try {
    const key = `${USER_KEY_PREFIX}${id}`;
    const sanitized = sanitizeUser(userData);
    await redisClient.setex(key, USER_TTL, JSON.stringify(sanitized));
    logger.debug(`[users.cache] Usuario almacenado en caché id=${id}`);
    return true;
  } catch (error) {
    logger.error(`[users.cache] Error en setUserById id=${id}: ${error.message}`);
    return false;
  }
};

const getAllUsers = async () => {
  try {
    const cached = await redisClient.get(USERS_ALL_KEY);
    if (cached) {
      logger.debug(`[users.cache] Cache HIT - getAllUsers`);
      return JSON.parse(cached);
    }
    logger.debug(`[users.cache] Cache MISS - getAllUsers`);
    return null;
  } catch (error) {
    logger.error(`[users.cache] Error en getAllUsers: ${error.message}`);
    return null;
  }
};

const setAllUsers = async (usersArray) => {
  try {
    const sanitized = sanitizeUsers(usersArray);
    await redisClient.setex(USERS_ALL_KEY, USERS_LIST_TTL, JSON.stringify(sanitized));
    logger.debug(`[users.cache] Listado de usuarios almacenado en caché count=${sanitized.length}`);
    return true;
  } catch (error) {
    logger.error(`[users.cache] Error en setAllUsers: ${error.message}`);
    return false;
  }
};

const invalidateUserById = async (id) => {
  try {
    const key = `${USER_KEY_PREFIX}${id}`;
    await redisClient.del(key);
    await redisClient.del(USERS_ALL_KEY);
    logger.debug(`[users.cache] Caché invalidada para usuario id=${id} y listado completo`);
    return true;
  } catch (error) {
    logger.error(`[users.cache] Error en invalidateUserById id=${id}: ${error.message}`);
    return false;
  }
};

const invalidateAllUsers = async () => {
  try {
    await redisClient.del(USERS_ALL_KEY);
    logger.debug(`[users.cache] Caché del listado completo de usuarios invalidada`);
    return true;
  } catch (error) {
    logger.error(`[users.cache] Error en invalidateAllUsers: ${error.message}`);
    return false;
  }
};

const invalidateAll = async () => {
  try {
    await invalidateAllUsers();

    const pattern = `${USER_KEY_PREFIX}*`;
    let cursor = '0';
    const keysToDelete = [];

    do {
      const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys && keys.length > 0) {
        keysToDelete.push(...keys);
      }
    } while (cursor !== '0');

    if (keysToDelete.length > 0) {
      await redisClient.del(...keysToDelete);
    }

    logger.debug(`[users.cache] Limpieza total de caché de usuarios completada. Claves eliminadas: ${keysToDelete.length}`);
    return true;
  } catch (error) {
    logger.error(`[users.cache] Error en invalidateAll: ${error.message}`);
    return false;
  }
};

module.exports = {
  getUserById,
  setUserById,
  getAllUsers,
  setAllUsers,
  invalidateUserById,
  invalidateAllUsers,
  invalidateAll,
};