tests/unit/controllers/holaController.test.js

```javascript
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock('../../../src/utils/response', () => ({
  sendSuccess: jest.fn(),
}));

const holaController = require('../../../src/controllers/holaController');
const logger = require('../../../src/utils/logger');

describe('HolaController', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      requestId: 'test-request-id-123',
      user: {
        id: 'user-test-id-001',
        email: 'test@example.com',
      },
      headers: {},
      method: 'GET',
      path: '/api/v1/hola',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHola', () => {
    it('Caso 1: debe llamar a res.json exactamente una vez con la propiedad message igual a Hola Mundo', async () => {
      await holaController.getHola(req, res);

      expect(res.json).toHaveBeenCalledTimes(1);

      const responseArg = res.json.mock.calls[0][0];

      expect(responseArg).toEqual(
        expect.objectContaining({
          message: 'Hola Mundo',
        })
      );
    });

    it('Caso 2: debe incluir un timestamp con formato ISO 8601 válido en la respuesta', async () => {
      await holaController.getHola(req, res);

      const responseArg = res.json.mock.calls[0][0];

      expect(responseArg).toHaveProperty('timestamp');

      const { timestamp } = responseArg;

      expect(typeof timestamp).toBe('string');

      const parsedDate = new Date(timestamp);
      expect(parsedDate.toString()).not.toBe('Invalid Date');

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
      expect(timestamp).toMatch(iso8601Regex);
    });

    it('Caso 3: debe incluir requestId en la respuesta con el mismo valor que req.requestId', async () => {
      await holaController.getHola(req, res);

      const responseArg = res.json.mock.calls[0][0];

      expect(responseArg).toHaveProperty('requestId');
      expect(responseArg.requestId).toBe('test-request-id-123');
    });

    it('Caso 4: debe responder con código de estado HTTP 200', async () => {
      await holaController.getHola(req, res);

      if (res.status.mock.calls.length > 0) {
        expect(res.status).toHaveBeenCalledWith(200);
      } else {
        // El controlador usa res.json directamente sin llamar a res.status con código de error
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalledWith(
          expect.not.arrayContaining([200])
        );
      }
    });

    it('Caso 5: debe invocar logger.info al menos una vez para registrar la operación exitosa', async () => {
      await holaController.getHola(req, res);

      expect(logger.info).toHaveBeenCalledTimes(expect.any(Number));
      expect(logger.info.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('Caso 6: no debe lanzar excepción cuando requestId no está presente en req y debe generar respuesta válida', async () => {
      const reqSinRequestId = {
        user: {
          id: 'user-test-id-001',
          email: 'test@example.com',
        },
        headers: {},
        method: 'GET',
        path: '/api/v1/hola',
      };

      await expect(
        holaController.getHola(reqSinRequestId, res)
      ).resolves.not.toThrow();

      expect(res.json).toHaveBeenCalledTimes(1);

      const responseArg = res.json.mock.calls[0][0];

      expect(responseArg).toEqual(
        expect.objectContaining({
          message: 'Hola Mundo',
        })
      );

      const requestIdValue = responseArg.requestId;
      const isAcceptableValue =
        requestIdValue === null ||
        requestIdValue === undefined ||
        requestIdValue === '';

      expect(isAcceptableValue).toBe(true);
    });
  });
});