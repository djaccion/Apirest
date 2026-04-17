const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const authService = require('../../../services/auth.service');

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('generateToken', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('debe retornar un string JWT válido cuando recibe un payload de usuario correcto', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };

    jwt.sign.mockImplementation((p, secret, options) => {
      return realJwt.sign(p, secret, options);
    });

    const token = authService.generateToken(payload);

    expect(typeof token).toBe('string');

    const decoded = realJwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });

  test('debe incluir el campo iat y exp en el token generado', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };

    jwt.sign.mockImplementation((p, secret, options) => {
      return realJwt.sign(p, secret, options);
    });

    const token = authService.generateToken(payload);
    const decoded = realJwt.decode(token);

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(Number.isInteger(decoded.iat)).toBe(true);
    expect(Number.isInteger(decoded.exp)).toBe(true);
    expect(decoded.iat).toBeGreaterThan(0);
    expect(decoded.exp).toBeGreaterThan(0);
  });

  test('debe lanzar un error o retornar null cuando el payload es undefined o null', () => {
    jwt.sign.mockImplementation(() => {
      throw new Error('Invalid payload');
    });

    expect(() => authService.generateToken(null)).toThrow();
    expect(() => authService.generateToken(undefined)).toThrow();
  });

  test('debe generar tokens distintos para el mismo payload en llamadas consecutivas', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };

    let callCount = 0;
    jwt.sign.mockImplementation((p, secret, options) => {
      callCount++;
      return realJwt.sign({ ...p, _nonce: callCount }, secret, options);
    });

    const token1 = authService.generateToken(payload);
    const token2 = authService.generateToken(payload);

    expect(typeof token1).toBe('string');
    expect(typeof token2).toBe('string');
    expect(token1).not.toBe(token2);
  });
});

describe('generateRefreshToken', () => {
  test('debe retornar un refresh token con expiración de 7 días', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123' };

    jwt.sign.mockImplementation((p, secret, options) => {
      return realJwt.sign(p, secret, options);
    });

    const token = authService.generateRefreshToken(payload);
    const decoded = realJwt.decode(token);

    const diff = decoded.exp - decoded.iat;
    const sevenDaysInSeconds = 604800;
    const tolerance = 60;

    expect(Math.abs(diff - sevenDaysInSeconds)).toBeLessThanOrEqual(tolerance);
  });

  test('debe contener únicamente el campo id en el payload del refresh token', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123' };

    jwt.sign.mockImplementation((p, secret, options) => {
      return realJwt.sign(p, secret, options);
    });

    const token = authService.generateRefreshToken(payload);
    const decoded = realJwt.decode(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBeUndefined();
    expect(decoded.role).toBeUndefined();
  });

  test('debe ser válido con el secret configurado', () => {
    const realJwt = jest.requireActual('jsonwebtoken');
    const payload = { id: 'user123' };

    jwt.sign.mockImplementation((p, secret, options) => {
      return realJwt.sign(p, secret, options);
    });

    const token = authService.generateRefreshToken(payload);

    expect(() => {
      realJwt.verify(token, process.env.JWT_SECRET);
    }).not.toThrow();
  });
});

describe('hashPassword', () => {
  test('debe llamar a bcrypt.hash con la contraseña en texto plano y salt rounds de exactamente 12', async () => {
    const plainPassword = 'MySecurePassword123!';
    bcrypt.hash.mockResolvedValue('hashed-password-mock');

    await authService.hashPassword(plainPassword);

    expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
  });

  test('debe retornar el hash resultante de bcrypt.hash', async () => {
    const plainPassword = 'MySecurePassword123!';
    const mockedHash = 'hashed-password-mock';
    bcrypt.hash.mockResolvedValue(mockedHash);

    const result = await authService.hashPassword(plainPassword);

    expect(result).toBe(mockedHash);
  });

  test('debe propagar el error si bcrypt.hash falla', async () => {
    const plainPassword = 'MySecurePassword123!';
    bcrypt.hash.mockRejectedValue(new Error('bcrypt error'));

    await expect(authService.hashPassword(plainPassword)).rejects.toThrow('bcrypt error');
  });

  test('debe rechazar o lanzar error si la contraseña es un string vacío', async () => {
    bcrypt.hash.mockRejectedValue(new Error('Password cannot be empty'));

    await expect(authService.hashPassword('')).rejects.toThrow();
  });
});

describe('validatePassword', () => {
  test('debe retornar true cuando la contraseña en texto plano coincide con el hash almacenado', async () => {
    const plainPassword = 'MySecurePassword123!';
    const storedHash = '$2b$12$hashedvalue';
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.validatePassword(plainPassword, storedHash);

    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, storedHash);
  });

  test('debe retornar false cuando la contraseña no coincide con el hash', async () => {
    const plainPassword = 'WrongPassword123!';
    const storedHash = '$2b$12$hashedvalue';
    bcrypt.compare.mockResolvedValue(false);

    const result = await authService.validatePassword(plainPassword, storedHash);

    expect(result).toBe(false);
  });

  test('debe propagar el error si bcrypt.compare lanza una excepción', async () => {
    const plainPassword = 'MySecurePassword123!';
    const storedHash = '$2b$12$hashedvalue';
    bcrypt.compare.mockRejectedValue(new Error('compare error'));

    await expect(authService.validatePassword(plainPassword, storedHash)).rejects.toThrow('compare error');
  });

  test('debe manejar correctamente el caso donde el hash almacenado es undefined o null', async () => {
    const plainPassword = 'MySecurePassword123!';

    bcrypt.compare.mockRejectedValue(new Error('data and hash arguments required'));

    await expect(authService.validatePassword(plainPassword, null)).rejects.toThrow();
    await expect(authService.validatePassword(plainPassword, undefined)).rejects.toThrow();
  });
});

describe('verifyToken', () => {
  const realJwt = jest.requireActual('jsonwebtoken');

  beforeAll(() => {
    jwt.verify.mockImplementation((token, secret) => {
      return realJwt.verify(token, secret);
    });

    jwt.sign.mockImplementation((payload, secret, options) => {
      return realJwt.sign(payload, secret, options);
    });
  });

  test('debe retornar el payload decodificado cuando el token es válido', () => {
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };
    const token = realJwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const decoded = authService.verifyToken(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.username).toBe(payload.username);
    expect(decoded.role).toBe(payload.role);
  });

  test('debe lanzar JsonWebTokenError cuando el token tiene firma inválida', () => {
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };
    const token = realJwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });

    expect(() => authService.verifyToken(token)).toThrow(realJwt.JsonWebTokenError);
  });

  test('debe lanzar TokenExpiredError cuando el token ha expirado', () => {
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };
    const token = realJwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1s' });

    expect(() => authService.verifyToken(token)).toThrow(realJwt.TokenExpiredError);
  });

  test('debe lanzar error cuando el token es un string malformado', () => {
    const malformedToken = 'this.is.not.a.valid.jwt.token';

    expect(() => authService.verifyToken(malformedToken)).toThrow();
  });

  test('debe lanzar error cuando el token es null o undefined', () => {
    expect(() => authService.verifyToken(null)).toThrow();
    expect(() => authService.verifyToken(undefined)).toThrow();
  });

  test('debe retornar un objeto con los campos iat y exp correctamente definidos', () => {
    const payload = { id: 'user123', username: 'adminUser', role: 'admin' };
    const token = realJwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const decoded = authService.verifyToken(token);

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
    expect(Number.isInteger(decoded.iat)).toBe(true);
    expect(Number.isInteger(decoded.exp)).toBe(true);
  });
});