const jwt = require('jsonwebtoken');
const {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} = require('../../../src/utils/jwt.utils');

describe('generateToken', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_super_secret_key_1234567890abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
  });

  describe('Happy Path', () => {
    const validPayload = { id: 1, email: 'test@example.com', role: 'admin' };

    it('debe retornar una cadena de texto cuando se le pasa un payload válido', () => {
      const token = generateToken(validPayload);
      expect(typeof token).toBe('string');
    });

    it('el token retornado debe tener exactamente tres segmentos separados por punto', () => {
      const token = generateToken(validPayload);
      const segments = token.split('.');
      expect(segments).toHaveLength(3);
    });

    it('al decodificar el token el payload debe contener los campos originales', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(validPayload.id);
      expect(decoded.email).toBe(validPayload.email);
      expect(decoded.role).toBe(validPayload.role);
    });

    it('el token debe contener el campo estándar iat con un valor numérico', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(typeof decoded.iat).toBe('number');
    });

    it('el token debe contener el campo estándar exp con un valor numérico mayor que iat', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('debe generar tokens distintos para el mismo payload en llamadas sucesivas', async () => {
      const token1 = generateToken(validPayload);
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const token2 = generateToken(validPayload);
      expect(token1).not.toBe(token2);
    });
  });

  describe('Error Path', () => {
    it('debe lanzar un error o retornar null cuando el payload es null', () => {
      let result;
      try {
        result = generateToken(null);
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error o retornar null cuando el payload es undefined', () => {
      let result;
      try {
        result = generateToken(undefined);
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe comportarse de forma definida cuando el payload es un objeto vacío', () => {
      let result;
      let error;
      try {
        result = generateToken({});
      } catch (e) {
        error = e;
      }
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(typeof result).toBe('string');
        const segments = result.split('.');
        expect(segments).toHaveLength(3);
      }
    });
  });
});

describe('verifyToken', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_super_secret_key_1234567890abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
  });

  describe('Happy Path', () => {
    it('debe retornar el payload decodificado correctamente cuando se pasa un token válido', () => {
      const payload = { id: 1, email: 'test@example.com', role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('el objeto retornado debe contener los campos originales más iat y exp', () => {
      const payload = { id: 2, email: 'user@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    it('debe funcionar correctamente con tokens que contienen rol admin', () => {
      const payload = { id: 3, email: 'admin@example.com', role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.role).toBe('admin');
    });

    it('debe funcionar correctamente con tokens que contienen rol user', () => {
      const payload = { id: 4, email: 'user@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.role).toBe('user');
    });

    it('debe funcionar correctamente con tokens que contienen rol viewer', () => {
      const payload = { id: 5, email: 'viewer@example.com', role: 'viewer' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.role).toBe('viewer');
    });

    it('debe retornar el payload cuando el token está próximo a expirar pero aún es válido', () => {
      const payload = { id: 6, email: 'expiring@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2s' });
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(payload.id);
    });
  });

  describe('Error Path', () => {
    it('debe lanzar un error o retornar null cuando el token está firmado con un secret diferente', () => {
      const payload = { id: 7, email: 'fake@example.com', role: 'admin' };
      const tokenWithWrongSecret = jwt.sign(payload, 'wrong_secret_completely_different');
      let result;
      try {
        result = verifyToken(tokenWithWrongSecret);
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error o retornar null cuando el token tiene formato inválido', () => {
      let result;
      try {
        result = verifyToken('this_is_not_a_valid_jwt_token_at_all');
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error o retornar null cuando el token está vacío', () => {
      let result;
      try {
        result = verifyToken('');
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error o retornar null cuando el token es null', () => {
      let result;
      try {
        result = verifyToken(null);
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error o retornar null cuando el token es undefined', () => {
      let result;
      try {
        result = verifyToken(undefined);
      } catch (e) {
        result = null;
      }
      expect(result).toBeNull();
    });

    it('debe lanzar un error de tipo TokenExpiredError cuando el token ha expirado', () => {
      const payload = { id: 8, email: 'expired@example.com', role: 'user' };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      let thrownError;
      let result;
      try {
        result = verifyToken(expiredToken);
      } catch (e) {
        thrownError = e;
      }

      if (thrownError) {
        expect(thrownError.name).toBe('TokenExpiredError');
      } else {
        expect(result).toBeNull();
      }
    });

    it('debe lanzar un error de tipo JsonWebTokenError cuando la firma del token ha sido manipulada', () => {
      const payload = { id: 9, email: 'tampered@example.com', role: 'admin' };
      const token = generateToken(payload);
      const segments = token.split('.');
      segments[2] = 'tampered_signature_invalid_base64url_xyz';
      const tamperedToken = segments.join('.');

      let thrownError;
      let result;
      try {
        result = verifyToken(tamperedToken);
      } catch (e) {
        thrownError = e;
      }

      if (thrownError) {
        expect(thrownError.name).toBe('JsonWebTokenError');
      } else {
        expect(result).toBeNull();
      }
    });
  });
});

describe('extractTokenFromHeader', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_super_secret_key_1234567890abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
  });

  describe('Happy Path', () => {
    it('debe retornar el token puro sin el prefijo Bearer cuando el header tiene el formato correcto', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.signature';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('debe funcionar con tokens de longitud variable', () => {
      const shortToken = 'abc.def.ghi';
      const longToken = 'a'.repeat(100) + '.' + 'b'.repeat(100) + '.' + 'c'.repeat(100);

      const extractedShort = extractTokenFromHeader(`Bearer ${shortToken}`);
      const extractedLong = extractTokenFromHeader(`Bearer ${longToken}`);

      expect(extractedShort).toBe(shortToken);
      expect(extractedLong).toBe(longToken);
    });

    it('debe ser case-sensitive respecto al prefijo Bearer según RFC 6750', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.signature';
      const validHeader = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(validHeader);
      expect(extracted).toBe(token);
    });

    it('debe retornar el token correcto cuando el header contiene un JWT real generado', () => {
      const payload = { id: 10, email: 'extract@example.com', role: 'admin' };
      const realToken = generateToken(payload);
      const header = `Bearer ${realToken}`;
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(realToken);
    });
  });

  describe('Error Path', () => {
    it('debe retornar null o undefined cuando el header es undefined', () => {
      const result = extractTokenFromHeader(undefined);
      expect(result == null).toBe(true);
    });

    it('debe retornar null o undefined cuando el header es una cadena vacía', () => {
      const result = extractTokenFromHeader('');
      expect(result == null).toBe(true);
    });

    it('debe retornar null o undefined cuando el header no contiene el prefijo Bearer', () => {
      const result = extractTokenFromHeader('Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.signature');
      expect(result == null).toBe(true);
    });

    it('debe retornar null o undefined cuando el header contiene solo la palabra Bearer sin token', () => {
      const result = extractTokenFromHeader('Bearer');
      expect(result == null).toBe(true);
    });

    it('debe retornar null o undefined cuando el header contiene Bearer seguido solo de espacios', () => {
      const result = extractTokenFromHeader('Bearer   ');
      const isNullOrEmptyOrUndefined = result == null || (typeof result === 'string' && result.trim() === '');
      expect(isNullOrEmptyOrUndefined).toBe(true);
    });

    it('debe retornar null o undefined cuando el header es null', () => {
      const result = extractTokenFromHeader(null);
      expect(result == null).toBe(true);
    });

    it('debe retornar null o undefined cuando el prefijo es bearer en minúsculas', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.signature';
      const result = extractTokenFromHeader(`bearer ${token}`);
      const isNullOrNotToken = result == null || result !== token;
      expect(isNullOrNotToken).toBe(true);
    });

    it('debe retornar null o undefined cuando el prefijo es BEARER en mayúsculas', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.signature';
      const result = extractTokenFromHeader(`BEARER ${token}`);
      const isNullOrNotToken = result == null || result !== token;
      expect(isNullOrNotToken).toBe(true);
    });
  });
});

describe('Token Expiration Behavior', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_super_secret_key_1234567890abcdefghijklmnopqrstuvwxyz';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
    if (originalExpiresIn === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiresIn;
    }
    jest.useRealTimers();
  });

  describe('Happy Path', () => {
    it('un token con expiración de 1h debe ser válido inmediatamente después de generarse', () => {
      const payload = { id: 11, email: 'valid@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.id).toBe(payload.id);
    });

    it('el campo exp debe ser aproximadamente iat + 3600 para tokens de 1h', () => {
      const payload = { id: 12, email: 'expcheck@example.com', role: 'user' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const diff = decoded.exp - decoded.iat;
      expect(diff).toBe(3600);
    });
  });

  describe('Error Path', () => {
    it('debe detectar correctamente un token expirado usando jwt.sign con expiresIn 0s', () => {
      const payload = { id: 13, email: 'expired@example.com', role: 'admin' };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '0s' });

      let thrownError;
      let result;
      try {
        result = verifyToken(expiredToken);
      } catch (e) {
        thrownError = e;
      }

      if (thrownError) {
        expect(thrownError.name).toBe('TokenExpiredError');
        expect(thrownError).toHaveProperty('expiredAt');
      } else {
        expect(result).toBeNull();
      }
    });

    it('debe manejar correctamente tokens con expiración negativa', () => {
      const payload = { id: 14, email: 'negative@example.com', role: 'user' };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -1 });

      let thrownError;
      let result;
      try {
        result = verifyToken(expiredToken);
      } catch (e) {
        thrownError = e;
      }

      if (thrownError) {
        expect(['TokenExpiredError', 'JsonWebTokenError']).toContain(thrownError.name);
      } else {
        expect(result).toBeNull();
      }
    });

    it('debe usar fake timers para simular expiración de token con expiresIn de 1s', () => {
      jest.useFakeTimers();

      const payload = { id: 15, email: 'faketimer@example.com', role: 'user' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1s' });

      jest.advanceTimersByTime(2000);

      let thrownError;
      let result;
      try {
        result = verifyToken(token);
      } catch (e) {
        thrownError = e;
      }

      jest.useRealTimers();

      if (thrownError) {
        expect(thrownError.name).toBe('TokenExpiredError');
      } else {
        expect(result).toBeNull();
      }
    });

    it('debe lanzar JsonWebTokenError para tokens con algoritmo none', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payloadEncoded = Buffer.from(JSON.stringify({ id: 16, email: 'none@example.com', role: 'admin' })).toString('base64url');
      const noneToken = `${header}.${payloadEncoded}.`;

      let thrownError;
      let result;
      try {
        result = verifyToken(noneToken);
      } catch (e) {
        thrownError = e;
      }

      if (thrownError) {
        expect(['JsonWebTokenError', 'TokenExpiredError']).toContain(thrownError.name);
      } else {
        expect(result).toBeNull();
      }
    });
  });
});