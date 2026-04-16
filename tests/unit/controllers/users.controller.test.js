const userService = require('../../../src/services/users.service');
const usersController = require('../../../src/controllers/users.controller');

jest.mock('../../../src/services/users.service');

describe('UsersController - Unit Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn(),
      json: jest.fn(),
      send: jest.fn(),
    };

    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    res.send.mockReturnValue(res);
  });

  describe('createUser', () => {
    test('should return 201 when user is created successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        role: 'user',
      };

      req = {
        body: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'user',
        },
      };

      userService.createUser.mockResolvedValue(mockUser);

      await usersController.createUser(req, res);

      expect(userService.createUser).toHaveBeenCalledTimes(1);
      expect(userService.createUser).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('should return 409 when email already exists', async () => {
      req = {
        body: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'user',
        },
      };

      const conflictError = new Error('User already exists with this email');
      conflictError.code = 'CONFLICT';
      userService.createUser.mockRejectedValue(conflictError);

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    test('should return 500 when an unexpected error occurs', async () => {
      req = {
        body: {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'SecurePass123!',
          role: 'user',
        },
      };

      userService.createUser.mockRejectedValue(new Error('Unexpected database error'));

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('getAllUsers', () => {
    test('should return 200 with array of users when users exist', async () => {
      const mockUsers = [
        { id: 1, username: 'johndoe', email: 'john@example.com', role: 'user' },
        { id: 2, username: 'janedoe', email: 'jane@example.com', role: 'admin' },
      ];

      req = {
        query: {},
      };

      userService.getAllUsers.mockResolvedValue(mockUsers);

      await usersController.getAllUsers(req, res);

      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('should return 200 with empty array when no users exist', async () => {
      req = {
        query: {},
      };

      userService.getAllUsers.mockResolvedValue([]);

      await usersController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should return 500 when service throws an error', async () => {
      req = {
        query: {},
      };

      userService.getAllUsers.mockRejectedValue(new Error('Database connection failed'));

      await usersController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('getUserById', () => {
    test('should return 200 with user when user is found', async () => {
      const mockUser = {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        role: 'user',
      };

      req = {
        params: { id: '1' },
      };

      userService.getUserById.mockResolvedValue(mockUser);

      await usersController.getUserById(req, res);

      expect(userService.getUserById).toHaveBeenCalledTimes(1);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('should return 404 when user is not found', async () => {
      req = {
        params: { id: '999' },
      };

      const notFoundError = new Error('User not found');
      notFoundError.code = 'NOT_FOUND';
      userService.getUserById.mockResolvedValue(null);

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    test('should return 500 when an unexpected error occurs', async () => {
      req = {
        params: { id: '1' },
      };

      userService.getUserById.mockRejectedValue(new Error('Unexpected error'));

      await usersController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('updateUser', () => {
    test('should return 200 with updated user when update is successful', async () => {
      const mockUpdatedUser = {
        id: 1,
        username: 'johndoe_updated',
        email: 'john_updated@example.com',
        role: 'user',
      };

      req = {
        params: { id: '1' },
        body: {
          username: 'johndoe_updated',
          email: 'john_updated@example.com',
        },
      };

      userService.updateUser.mockResolvedValue(mockUpdatedUser);

      await usersController.updateUser(req, res);

      expect(userService.updateUser).toHaveBeenCalledTimes(1);
      expect(userService.updateUser).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedUser);
    });

    test('should return 404 when user to update is not found', async () => {
      req = {
        params: { id: '999' },
        body: {
          username: 'johndoe_updated',
        },
      };

      userService.updateUser.mockResolvedValue(null);

      await usersController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    test.todo(
      'should return 400 when attempting to update password directly - validation handled by middleware'
    );

    test('should return 500 when an unexpected error occurs during update', async () => {
      req = {
        params: { id: '1' },
        body: {
          username: 'johndoe_updated',
        },
      };

      userService.updateUser.mockRejectedValue(new Error('Unexpected error during update'));

      await usersController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('deleteUser', () => {
    test('should return 200 or 204 when user is deleted successfully', async () => {
      req = {
        params: { id: '1' },
      };

      userService.deleteUser.mockResolvedValue({ deleted: true });

      await usersController.deleteUser(req, res);

      const statusCall = res.status.mock.calls[0][0];
      expect([200, 204]).toContain(statusCall);

      if (statusCall === 200) {
        expect(res.json).toHaveBeenCalled();
      }
    });

    test('should return 404 when user to delete is not found', async () => {
      req = {
        params: { id: '999' },
      };

      userService.deleteUser.mockResolvedValue(null);

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    test('should return 500 when an unexpected error occurs during deletion', async () => {
      req = {
        params: { id: '1' },
      };

      userService.deleteUser.mockRejectedValue(new Error('Unexpected error during deletion'));

      await usersController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });
});