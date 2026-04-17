const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const authMiddleware = require('../../../src/middlewares/authMiddleware');

describe('AuthMiddleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  const FIXED_REQUEST_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  beforeEach(() => {
    mockRequest = {
      headers: {},
      id: FIXED_REQUEST_ID,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('cuando el header Authorization está ausente', () => {
    it('Test 1.1 - Sin header Authorization en absoluto: debe retornar 401 con success false', () => {
      mockRequest.headers = {};

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/token/i);
    });

    it('Test 1.2 - Header Authorization presente pero vacío: debe retornar 401 con success false', () => {
      mockRequest.headers.authorization = '';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );
    });

    it('Test 1.3 - Header Authorization con valor que no comienza con Bearer: debe retornar 401 con formato inválido', () => {
      mockRequest.headers.authorization = 'Basic sometoken';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/formato|invalid|bearer/i);
    });
  });

  describe('cuando el formato del token es inválido', () => {
    it('Test 2.1 - Header con Bearer pero sin token después: debe retornar 401', () => {
      mockRequest.headers.authorization = 'Bearer ';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );
    });

    it('Test 2.2 - Header con Bearer seguido de múltiples segmentos: debe retornar 401 con formato inválido', () => {
      mockRequest.headers.authorization = 'Bearer token1 token2';

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/formato|invalid|bearer/i);
    });
  });

  describe('cuando el token JWT es procesado por jsonwebtoken', () => {
    beforeEach(() => {
      mockRequest.headers.authorization = 'Bearer validtoken';
    });

    it('Test 3.1 - Token expirado: debe retornar 401 con mensaje de expiración', () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(expiredError, null);
      });

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/expir/i);
    });

    it('Test 3.2 - Token con firma inválida: debe retornar 401 con mensaje de token inválido', () => {
      const invalidSignatureError = new Error('invalid signature');
      invalidSignatureError.name = 'JsonWebTokenError';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(invalidSignatureError, null);
      });

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/inv[aá]lid|token/i);
    });

    it('Test 3.3 - Token válido y verificado correctamente: debe llamar a next y poblar req.user', () => {
      const decodedPayload = {
        userId: '123',
        email: 'test@test.com',
        iat: 1234567890,
      };

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedPayload);
      });

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.user).toEqual(decodedPayload);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('Test 3.4 - Error genérico inesperado de jsonwebtoken: debe retornar 401 con mensaje genérico', () => {
      const notBeforeError = new Error('jwt not active');
      notBeforeError.name = 'NotBeforeError';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(notBeforeError, null);
      });

      authMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          requestId: FIXED_REQUEST_ID,
        })
      );

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.message).toMatch(/autenticaci[oó]n|authentication|token/i);
    });
  });
});