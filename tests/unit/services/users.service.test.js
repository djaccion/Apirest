const bcrypt = require('bcrypt');

jest.mock('../../../src/repositories/users.repository');
jest.mock('../../../src/services/cache.service');
jest.mock('../../../src/events/event.publisher');
jest.mock('bcrypt');

const UsersService = require('../../../src/services/users.service');
const UsersRepository = require('../../../src/repositories/users.repository');
const CacheService = require('../../../src/services/cache.service');
const EventPublisher = require('../../../src/events/event.publisher');

describe('UsersService', () => {
  let usersService;
  let mockRepository;
  let mockCacheService;
  let mockEventPublisher;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockEventPublisher = {
      publish: jest.fn(),
    };

    UsersRepository.mockImplementation(() => mockRepository);
    CacheService.mockImplementation(() => mockCacheService);
    EventPublisher.mockImplementation(() => mockEventPublisher);

    bcrypt.hash = jest.fn().mockResolvedValue('hashed_password_mock');
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    usersService = new UsersService(mockRepository, mockCacheService, mockEventPublisher);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createUser', () => {
    const validPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plainPassword123',
      role: 'user',
    };

    const createdUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password_mock',
      role: 'user',
    };

    it('should create user successfully, hash password, publish event and return user without password', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);

      const result = await usersService.createUser(validPayload);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(validPayload.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validPayload.password, expect.any(Number));

      const saltRoundsUsed = bcrypt.hash.mock.calls[0][1];
      expect(saltRoundsUsed).toBeGreaterThanOrEqual(12);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed_password_mock',
        })
      );
      expect(mockRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: validPayload.password,
        })
      );

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.created',
        expect.not.objectContaining({ password: expect.anything() })
      );

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', validPayload.email);
    });

    it('should throw EmailAlreadyExistsError when email is already registered', async () => {
      mockRepository.findByEmail.mockResolvedValue({
        id: 99,
        email: validPayload.email,
      });

      await expect(usersService.createUser(validPayload)).rejects.toThrow(
        /email already exists|email.*already.*registered|duplicate/i
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw validation error when email is missing', async () => {
      const payloadWithoutEmail = { name: 'John', password: 'pass123' };

      await expect(usersService.createUser(payloadWithoutEmail)).rejects.toThrow();

      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error when password is missing', async () => {
      const payloadWithoutPassword = { name: 'John', email: 'john@example.com' };

      await expect(usersService.createUser(payloadWithoutPassword)).rejects.toThrow();

      expect(mockRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    const cachedUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];

    const dbUsers = [
      { id: 1, name: 'Alice', email: 'alice@example.com', password: 'hash1' },
      { id: 2, name: 'Bob', email: 'bob@example.com', password: 'hash2' },
    ];

    it('should return cached data without calling repository when cache hit', async () => {
      mockCacheService.get.mockResolvedValue(cachedUsers);

      const result = await usersService.getAllUsers();

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockRepository.findAll).not.toHaveBeenCalled();
      expect(result).toEqual(cachedUsers);
    });

    it('should call repository, store in cache and return users without password on cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue(dbUsers);

      const result = await usersService.getAllUsers();

      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        expect.any(Number)
      );

      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should return empty array and still save to cache when repository returns empty array', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue([]);

      const result = await usersService.getAllUsers();

      expect(result).toEqual([]);
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    const userId = 42;
    const cachedUser = { id: userId, name: 'Alice', email: 'alice@example.com' };
    const dbUser = { id: userId, name: 'Alice', email: 'alice@example.com', password: 'hashedpw' };

    it('should return cached user without calling repository on cache hit', async () => {
      mockCacheService.get.mockResolvedValue(cachedUser);

      const result = await usersService.getUserById(userId);

      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining(String(userId)));
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedUser);
    });

    it('should query repository, save to cache and return user without password on cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(dbUser);

      const result = await usersService.getUserById(userId);

      expect(mockCacheService.get).toHaveBeenCalledWith(expect.stringContaining(String(userId)));
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(String(userId)),
        expect.any(Object),
        expect.any(Number)
      );
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', userId);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(null);

      await expect(usersService.getUserById(userId)).rejects.toThrow(
        new RegExp(`${userId}|not found|notfound`, 'i')
      );
    });

    it('should use cache key that includes the user id to avoid collisions', async () => {
      mockCacheService.get.mockResolvedValue(cachedUser);

      await usersService.getUserById(userId);

      const cacheKeyUsed = mockCacheService.get.mock.calls[0][0];
      expect(cacheKeyUsed).toContain(String(userId));
    });
  });

  describe('updateUser', () => {
    const userId = 10;
    const existingUser = {
      id: userId,
      name: 'Old Name',
      email: 'old@example.com',
      password: 'oldhash',
      role: 'user',
    };
    const updatePayloadWithoutPassword = { name: 'New Name', email: 'new@example.com' };
    const updatedUser = {
      id: userId,
      name: 'New Name',
      email: 'new@example.com',
      password: 'oldhash',
      role: 'user',
    };

    it('should update user without password change, invalidate caches, publish event and return user without password', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUser);

      const result = await usersService.updateUser(userId, updatePayloadWithoutPassword);

      expect(mockRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ name: 'New Name', email: 'new@example.com' })
      );

      expect(mockCacheService.del).toHaveBeenCalledWith(
        expect.stringContaining(String(userId))
      );

      const delCalls = mockCacheService.del.mock.calls.map((call) => call[0]);
      const invalidatedListCache = delCalls.some(
        (key) => !key.includes(String(userId)) || key.includes('list') || key.includes('all') || key.includes('users')
      );
      expect(delCalls.length).toBeGreaterThanOrEqual(1);

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.updated',
        expect.any(Object)
      );

      expect(result).not.toHaveProperty('password');
    });

    it('should hash new password when payload includes password field', async () => {
      const payloadWithPassword = { name: 'New Name', password: 'newPlainPassword' };
      const updatedUserWithNewHash = { ...existingUser, name: 'New Name', password: 'hashed_password_mock' };

      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.update.mockResolvedValue(updatedUserWithNewHash);

      await usersService.updateUser(userId, payloadWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPlainPassword', expect.any(Number));
      expect(mockRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ password: 'hashed_password_mock' })
      );
    });

    it('should throw NotFoundError when user does not exist before updating', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(usersService.updateUser(userId, updatePayloadWithoutPassword)).rejects.toThrow(
        /not found|notfound/i
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    const userId = 55;
    const existingUser = {
      id: userId,
      name: 'To Delete',
      email: 'delete@example.com',
      password: 'somehash',
    };

    it('should delete user, invalidate caches and publish user.deleted event with user id', async () => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.delete.mockResolvedValue(true);

      await usersService.deleteUser(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userId);

      const delCalls = mockCacheService.del.mock.calls.map((call) => call[0]);
      const invalidatedUserCache = delCalls.some((key) => key.includes(String(userId)));
      expect(invalidatedUserCache).toBe(true);
      expect(delCalls.length).toBeGreaterThanOrEqual(1);

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'user.deleted',
        expect.objectContaining({ id: userId })
      );
    });

    it('should throw NotFoundError when user does not exist before deleting', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(usersService.deleteUser(userId)).rejects.toThrow(/not found|notfound/i);

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateCredentials', () => {
    const email = 'user@example.com';
    const plainPassword = 'mySecret123';
    const storedUser = {
      id: 7,
      name: 'Test User',
      email,
      password: 'stored_hashed_password',
      role: 'user',
    };

    it('should return user without password when credentials are valid', async () => {
      mockRepository.findByEmail.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await usersService.validateCredentials(email, plainPassword);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, storedUser.password);
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', storedUser.id);
      expect(result).toHaveProperty('email', email);
    });

    it('should throw generic authentication error when email is not registered', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      let errorMessage;
      try {
        await usersService.validateCredentials('nonexistent@example.com', plainPassword);
      } catch (err) {
        errorMessage = err.message;
      }

      expect(errorMessage).toBeDefined();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw same generic authentication error when password is incorrect', async () => {
      mockRepository.findByEmail.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(false);

      let errorMessageWrongPassword;
      try {
        await usersService.validateCredentials(email, 'wrongPassword');
      } catch (err) {
        errorMessageWrongPassword = err.message;
      }

      mockRepository.findByEmail.mockResolvedValue(null);

      let errorMessageNoEmail;
      try {
        await usersService.validateCredentials('noexist@example.com', plainPassword);
      } catch (err) {
        errorMessageNoEmail = err.message;
      }

      expect(errorMessageWrongPassword).toBeDefined();
      expect(errorMessageNoEmail).toBeDefined();
      expect(errorMessageWrongPassword).toBe(errorMessageNoEmail);
    });

    it('should not reveal whether email exists or not in error messages', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      let notFoundError;
      try {
        await usersService.validateCredentials('ghost@example.com', plainPassword);
      } catch (err) {
        notFoundError = err;
      }

      mockRepository.findByEmail.mockResolvedValue(storedUser);
      bcrypt.compare.mockResolvedValue(false);

      let wrongPasswordError;
      try {
        await usersService.validateCredentials(email, 'wrongPass');
      } catch (err) {
        wrongPasswordError = err;
      }

      expect(notFoundError.message).toBe(wrongPasswordError.message);
    });
  });
});