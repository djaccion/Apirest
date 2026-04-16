const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');
const cacheClient = require('../cache/redis.client');
const eventPublisher = require('../events/event.publisher');
const logger = require('../utils/logger');
const config = require('../config');

const SALT_ROUNDS = 12;
const ALLOWED_ROLES = ['admin', 'user'];
const DEFAULT_ROLE = 'user';
const ALLOWED_UPDATE_FIELDS = ['name', 'role', 'status'];
const ALLOWED_CREATE_FIELDS = ['name', 'email', 'role', 'externalId', 'status'];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

function buildUserPayload(externalUser) {
  const payload = {};

  ALLOWED_CREATE_FIELDS.forEach((field) => {
    if (externalUser[field] !== undefined && externalUser[field] !== null) {
      payload[field] = externalUser[field];
    }
  });

  if (payload.role !== undefined) {
    const normalizedRole = String(payload.role).toLowerCase().trim();
    payload.role = ALLOWED_ROLES.includes(normalizedRole) ? normalizedRole : DEFAULT_ROLE;
  } else {
    payload.role = DEFAULT_ROLE;
  }

  return payload;
}

async function invalidateUserCache(userId) {
  try {
    const keysToDelete = [`user:${userId}`, 'users:list'];
    await Promise.all(keysToDelete.map((key) => cacheClient.del(key)));
    logger.debug({ userId }, 'Cache invalidated for user');
  } catch (cacheError) {
    logger.error({ err: cacheError, userId }, 'Failed to invalidate cache for user, continuing sync');
  }
}

async function publishUserEvent(eventType, userData) {
  try {
    const event = {
      type: eventType,
      payload: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        timestamp: new Date().toISOString(),
      },
    };

    const exchange = config.rabbitmq?.exchange || 'users.exchange';
    const queue = config.rabbitmq?.queue || 'users.sync';

    await eventPublisher.publish(exchange, queue, event);
    logger.debug({ eventType, userId: userData.id }, 'Event published to RabbitMQ');
  } catch (publishError) {
    logger.warn(
      { err: publishError, eventType, userId: userData.id },
      'Failed to publish event to RabbitMQ, continuing sync'
    );
  }
}

async function syncUsers(usersPayload) {
  if (!Array.isArray(usersPayload) || usersPayload.length === 0) {
    throw new ValidationError(
      'usersPayload must be a non-empty array of user objects'
    );
  }

  const summary = {
    total: usersPayload.length,
    created: 0,
    updated: 0,
    failed: [],
  };

  for (const externalUser of usersPayload) {
    const userIdentifier = externalUser.externalId || externalUser.email || 'unknown';

    try {
      const cleanPayload = buildUserPayload(externalUser);

      if (!cleanPayload.email) {
        throw new ValidationError(`User with identifier "${userIdentifier}" is missing required field: email`);
      }

      const existingUser = await userRepository.findByEmailOrExternalId(
        cleanPayload.email,
        cleanPayload.externalId
      );

      if (!existingUser) {
        if (!cleanPayload.password && !externalUser.password) {
          cleanPayload.password = await bcrypt.hash(
            Math.random().toString(36).slice(-12) + Date.now(),
            SALT_ROUNDS
          );
        } else if (externalUser.password) {
          cleanPayload.password = await bcrypt.hash(externalUser.password, SALT_ROUNDS);
        }

        const createdUser = await userRepository.create(cleanPayload);

        logger.info({ userId: createdUser.id, email: createdUser.email }, 'User created during sync');

        await invalidateUserCache(createdUser.id);
        await publishUserEvent('user.created', createdUser);

        summary.created += 1;
      } else {
        const updatePayload = {};
        ALLOWED_UPDATE_FIELDS.forEach((field) => {
          if (cleanPayload[field] !== undefined) {
            updatePayload[field] = cleanPayload[field];
          }
        });

        const updatedUser = await userRepository.update(existingUser.id, updatePayload);

        logger.info({ userId: updatedUser.id, email: updatedUser.email }, 'User updated during sync');

        await invalidateUserCache(updatedUser.id);
        await publishUserEvent('user.updated', updatedUser);

        summary.updated += 1;
      }
    } catch (userError) {
      logger.error(
        { err: userError, userIdentifier },
        'Failed to process user during sync'
      );

      summary.failed.push({
        identifier: userIdentifier,
        error: userError.message || 'Unknown error during user processing',
      });
    }
  }

  logger.info(
    {
      total: summary.total,
      created: summary.created,
      updated: summary.updated,
      failedCount: summary.failed.length,
    },
    'User sync completed'
  );

  return summary;
}

module.exports = {
  syncUsers,
};