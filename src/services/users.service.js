const bcrypt = require('bcrypt');
const usersRepositoryDefault = require('../repositories/users.repository');
const cacheClientDefault = require('../cache/redis.client');
const eventPublisherDefault = require('../events/publisher');
const logger = require('../utils/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const CACHE_TTL = 300;

class BusinessError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.status = status;
  }
}

class UsersService {
  constructor(
    usersRepository = usersRepositoryDefault,
    cacheClient = cacheClientDefault,
    eventPublisher = eventPublisherDefault
  ) {
    this.usersRepository = usersRepository;
    this.cacheClient = cacheClient;
    this.eventPublisher = eventPublisher;
  }

  _stripPassword(user) {
    if (!user) return user;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  _stripPasswordFromArray(users) {
    return users.map((user) => this._stripPassword(user));
  }

  async createUser(userData) {
    const existingUser = await this.usersRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new BusinessError(
        `User with email ${userData.email} already exists`,
        'USER_ALREADY_EXISTS',
        409
      );
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const userToCreate = {
      ...userData,
      password: passwordHash,
    };

    const createdUser = await this.usersRepository.create(userToCreate);

    try {
      await this.eventPublisher.publish('user.created', {
        id: createdUser.id,
        email: createdUser.email,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Failed to publish user.created event', { error: err.message, userId: createdUser.id });
    }

    try {
      await this._invalidateListCache();
    } catch (err) {
      logger.warn('Failed to invalidate list cache after createUser', { error: err.message });
    }

    logger.info('User created successfully', { userId: createdUser.id, email: createdUser.email });

    return this._stripPassword(createdUser);
  }

  async getAllUsers(filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const search = filters.search || '';

    const cacheKey = `users:list:page:${page}:limit:${limit}:search:${search}`;

    try {
      const cached = await this.cacheClient.get(cacheKey);
      if (cached) {
        logger.info('getAllUsers served from cache', { cacheKey });
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Cache read failed in getAllUsers', { error: err.message });
    }

    const users = await this.usersRepository.findAll(filters);
    const result = this._stripPasswordFromArray(users);

    try {
      await this.cacheClient.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    } catch (err) {
      logger.warn('Cache write failed in getAllUsers', { error: err.message });
    }

    return result;
  }

  async getUserById(id) {
    const cacheKey = `users:id:${id}`;

    try {
      const cached = await this.cacheClient.get(cacheKey);
      if (cached) {
        logger.info('getUserById served from cache', { cacheKey, userId: id });
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Cache read failed in getUserById', { error: err.message });
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new BusinessError(
        `User with id ${id} not found`,
        'USER_NOT_FOUND',
        404
      );
    }

    const userWithoutPassword = this._stripPassword(user);

    try {
      await this.cacheClient.set(cacheKey, JSON.stringify(userWithoutPassword), 'EX', CACHE_TTL);
    } catch (err) {
      logger.warn('Cache write failed in getUserById', { error: err.message });
    }

    return userWithoutPassword;
  }

  async updateUser(id, updateData) {
    await this.getUserById(id);

    const dataToUpdate = { ...updateData };

    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, SALT_ROUNDS);
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);

    try {
      await this._invalidateUserCache(id);
      await this._invalidateListCache();
    } catch (err) {
      logger.warn('Cache invalidation failed in updateUser', { error: err.message, userId: id });
    }

    const { password, ...eventPayload } = updateData;
    try {
      await this.eventPublisher.publish('user.updated', {
        id,
        updatedFields: eventPayload,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Failed to publish user.updated event', { error: err.message, userId: id });
    }

    logger.info('User updated successfully', { userId: id });

    return this._stripPassword(updatedUser);
  }

  async deleteUser(id) {
    await this.getUserById(id);

    await this.usersRepository.delete(id);

    try {
      await this._invalidateUserCache(id);
      await this._invalidateListCache();
    } catch (err) {
      logger.warn('Cache invalidation failed in deleteUser', { error: err.message, userId: id });
    }

    try {
      await this.eventPublisher.publish('user.deleted', {
        id,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn('Failed to publish user.deleted event', { error: err.message, userId: id });
    }

    logger.info('User deleted successfully', { userId: id });

    return { deleted: true, id };
  }

  async syncUsers(externalUsers) {
    const summary = { created: 0, updated: 0, unchanged: 0, errors: 0 };

    if (!Array.isArray(externalUsers)) {
      logger.warn('syncUsers received non-array input');
      return summary;
    }

    for (const externalUser of externalUsers) {
      try {
        const existingUser = await this.usersRepository.findByEmail(externalUser.email);

        if (!existingUser) {
          const userToCreate = { ...externalUser };
          if (!userToCreate.password) {
            userToCreate.password = this._generateTemporaryPassword();
          }
          await this.createUser(userToCreate);
          summary.created += 1;
          logger.info('syncUsers: user created', { email: externalUser.email });
        } else {
          const hasChanges = this._detectChanges(existingUser, externalUser);
          if (hasChanges) {
            const updateData = { ...externalUser };
            delete updateData.email;
            await this.updateUser(existingUser.id, updateData);
            summary.updated += 1;
            logger.info('syncUsers: user updated', { email: externalUser.email, userId: existingUser.id });
          } else {
            summary.unchanged += 1;
            logger.info('syncUsers: user unchanged', { email: externalUser.email, userId: existingUser.id });
          }
        }
      } catch (err) {
        summary.errors += 1;
        logger.error('syncUsers: error processing user', { email: externalUser.email, error: err.message });
      }
    }

    logger.info('syncUsers completed', summary);
    return summary;
  }

  _detectChanges(existingUser, externalUser) {
    const fieldsToCompare = ['name', 'role', 'username'];
    return fieldsToCompare.some((field) => {
      if (externalUser[field] === undefined) return false;
      return existingUser[field] !== externalUser[field];
    });
  }

  _generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async _invalidateUserCache(id) {
    const cacheKey = `users:id:${id}`;
    await this.cacheClient.del(cacheKey);
  }

  async _invalidateListCache() {
    try {
      const keys = await this.cacheClient.keys('users:list*');
      if (keys && keys.length > 0) {
        await this.cacheClient.del(...keys);
      }
    } catch (err) {
      logger.warn('Failed to invalidate list cache pattern', { error: err.message });
      await this.cacheClient.del('users:list:page:1:limit:10:search:');
    }
  }
}

module.exports = UsersService;