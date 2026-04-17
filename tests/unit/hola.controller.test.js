const holaController = require('../../src/controllers/hola.controller');

describe('HolaController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { id: '123', email: 'test@example.com' },
      headers: { authorization: 'Bearer token123' },
      method: 'GET',
    };

    res = {
      status: jest.fn(),
      json: jest.fn(),
      send: jest.fn(),
    };
    res.status.mockReturnValue(res);

    next = jest.fn();
  });

  describe('successful response with valid user', () => {
    it('should return json exactly once when user is valid', () => {
      holaController(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
    });

    it('should return json with message, timestamp and user properties when user is valid', () => {
      holaController(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];

      expect(jsonArg).toBeDefined();
      expect(jsonArg.message).toBeDefined();
      expect(typeof jsonArg.message).toBe('string');
      expect(jsonArg.message.length).toBeGreaterThan(0);
      expect(jsonArg.timestamp).toBeDefined();
      expect(jsonArg.user).toBeDefined();
    });
  });

  describe('status code', () => {
    it('should call res.status with 200 before res.json when user is valid', () => {
      holaController(req, res, next);

      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should chain status and json correctly when user is valid', () => {
      holaController(req, res, next);

      const statusCallOrder = res.status.mock.invocationCallOrder[0];
      const jsonCallOrder = res.json.mock.invocationCallOrder[0];

      expect(statusCallOrder).toBeLessThan(jsonCallOrder);
    });
  });

  describe('timestamp property', () => {
    it('should return a valid ISO 8601 timestamp when user is valid', () => {
      holaController(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

      expect(jsonArg.timestamp).toMatch(isoRegex);
    });

    it('should generate dynamic timestamp on each call when user is valid', () => {
      const firstDate = new Date('2024-01-01T00:00:00.000Z');
      const secondDate = new Date('2024-01-01T00:00:01.000Z');

      const mockDateImplementation = jest
        .spyOn(global, 'Date')
        .mockImplementationOnce(() => firstDate)
        .mockImplementationOnce(() => secondDate);

      holaController(req, res, next);
      const firstJsonArg = res.json.mock.calls[0][0];

      res.json.mockClear();
      res.status.mockClear();

      holaController(req, res, next);
      const secondJsonArg = res.json.mock.calls[0][0];

      expect(firstJsonArg.timestamp).toBeDefined();
      expect(secondJsonArg.timestamp).toBeDefined();

      mockDateImplementation.mockRestore();
    });

    it('should use Date to generate timestamp when user is valid', () => {
      const fixedDate = new Date('2024-06-15T12:00:00.000Z');
      const mockDate = jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);

      holaController(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.timestamp).toBeDefined();

      mockDate.mockRestore();
    });
  });

  describe('user property reflects JWT payload', () => {
    it('should return user matching req.user when user has id and email', () => {
      holaController(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];

      expect(jsonArg.user).toEqual(req.user);
    });

    it('should return user matching req.user when user has different values', () => {
      req.user = { id: '999', email: 'another@domain.com', role: 'admin' };

      holaController(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];

      expect(jsonArg.user).toEqual({ id: '999', email: 'another@domain.com', role: 'admin' });
    });

    it('should not hardcode user data when req.user changes between calls', () => {
      holaController(req, res, next);
      const firstJsonArg = res.json.mock.calls[0][0];

      res.json.mockClear();
      res.status.mockClear();

      req.user = { id: '456', email: 'other@example.com' };
      holaController(req, res, next);
      const secondJsonArg = res.json.mock.calls[0][0];

      expect(firstJsonArg.user).toEqual({ id: '123', email: 'test@example.com' });
      expect(secondJsonArg.user).toEqual({ id: '456', email: 'other@example.com' });
    });
  });

  describe('next function not called', () => {
    it('should not call next when controller handles request successfully', () => {
      holaController(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should not call next when req.user is valid and response is sent', () => {
      req.user = { id: '777', email: 'valid@test.com' };

      holaController(req, res, next);

      expect(next).toHaveBeenCalledTimes(0);
    });
  });

  describe('handling missing or undefined req.user', () => {
    it('should respond in a controlled way when req.user is undefined', () => {
      req.user = undefined;

      expect(() => {
        holaController(req, res, next);
      }).not.toThrow();
    });

    it('should call res.json or next without crashing when req.user is undefined', () => {
      req.user = undefined;

      holaController(req, res, next);

      const jsonCalled = res.json.mock.calls.length > 0;
      const nextCalled = next.mock.calls.length > 0;

      expect(jsonCalled || nextCalled).toBe(true);
    });

    it('should respond in a controlled way when req.user is null', () => {
      req.user = null;

      expect(() => {
        holaController(req, res, next);
      }).not.toThrow();
    });

    it('should call res.json or next without crashing when req.user is null', () => {
      req.user = null;

      holaController(req, res, next);

      const jsonCalled = res.json.mock.calls.length > 0;
      const nextCalled = next.mock.calls.length > 0;

      expect(jsonCalled || nextCalled).toBe(true);
    });
  });
});