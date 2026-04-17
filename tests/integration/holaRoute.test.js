const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_secret_key';
  }
});

afterAll(async () => {
});

function generateToken(payload = {}, expiresIn = '1h') {
  const defaultPayload = {
    sub: 'user_test_123',
    role: 'user',
    ...payload,
  };
  return jwt.sign(defaultPayload, process.env.JWT_SECRET, { expiresIn });
}

function generateExpiredToken() {
  return jwt.sign(
    { sub: 'user_test_123', role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '-1s' }
  );
}

describe('Integration: GET /api/hola', () => {
  describe('Autenticación', () => {
    test('Sin token: debe retornar 401 con propiedad de error', async () => {
      const res = await request(app).get('/api/hola');
      expect(res.status).toBe(401);
      const errorProp = res.body.error || res.body.message;
      expect(typeof errorProp).toBe('string');
      expect(errorProp.length).toBeGreaterThan(0);
    });

    test('Token malformado: debe retornar 401 con propiedad de error', async () => {
      const res = await request(app)
        .get('/api/hola')
        .set('Authorization', 'Bearer token_invalido_xyz');
      expect(res.status).toBe(401);
      const errorProp = res.body.error || res.body.message;
      expect(typeof errorProp).toBe('string');
      expect(errorProp.length).toBeGreaterThan(0);
    });

    test('Token con firma incorrecta: debe retornar 401', async () => {
      const tokenFirmaIncorrecta = jwt.sign(
        { sub: 'user_test_123', role: 'user' },
        'secret_incorrecto_diferente',
        { expiresIn: '1h' }
      );
      const res = await request(app)
        .get('/api/hola')
        .set('Authorization', `Bearer ${tokenFirmaIncorrecta}`);
      expect(res.status).toBe(401);
      const errorProp = res.body.error || res.body.message;
      expect(typeof errorProp).toBe('string');
      expect(errorProp.length).toBeGreaterThan(0);
    });

    test('Token expirado: debe retornar 401', async () => {
      const tokenExpirado = generateExpiredToken();
      const res = await request(app)
        .get('/api/hola')
        .set('Authorization', `Bearer ${tokenExpirado}`);
      expect(res.status).toBe(401);
      const errorProp = res.body.error || res.body.message;
      expect(typeof errorProp).toBe('string');
      expect(errorProp.length).toBeGreaterThan(0);
    });

    test('Token válido sin parámetros adicionales: no debe retornar 401', async () => {
      const token = generateToken();
      const res = await request(app)
        .get('/api/hola')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).not.toBe(401);
    });
  });

  describe('Validación de parámetros', () => {
    let validToken;

    beforeAll(() => {
      validToken = generateToken();
    });

    test('Parámetro nombre ausente: debe retornar 400 con errores de validación', async () => {
      const res = await request(app)
        .get('/api/hola')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(400);
      const errors = res.body.errors || res.body.error || res.body.message;
      expect(errors).toBeDefined();
      if (Array.isArray(errors)) {
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    test('Parámetro nombre vacío: debe retornar 400', async () => {
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: '' })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(400);
      const errors = res.body.errors || res.body.error || res.body.message;
      expect(errors).toBeDefined();
    });

    test('Parámetro nombre con caracteres especiales peligrosos: debe retornar 400 o sanitizar el valor', async () => {
      // Se verifica que el endpoint rechace o sanitice input con etiquetas XSS
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: '<script>alert(1)</script>' })
        .set('Authorization', `Bearer ${validToken}`);

      if (res.status === 200) {
        // Si la app sanitiza en lugar de rechazar, el mensaje no debe contener las etiquetas originales
        expect(res.body.mensaje).toBeDefined();
        expect(res.body.mensaje).not.toContain('<script>');
        expect(res.body.mensaje).not.toContain('</script>');
      } else {
        expect(res.status).toBe(400);
      }
    });

    test('Parámetro nombre con longitud excesiva (>100 chars): debe retornar 400', async () => {
      const nombreLargo = 'A'.repeat(101);
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: nombreLargo })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(400);
    });

    test('Parámetro nombre válido: debe retornar 200', async () => {
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: 'Mundo' })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Respuesta exitosa', () => {
    let validToken;

    beforeAll(() => {
      validToken = generateToken();
    });

    test('Estructura del body: debe contener propiedad mensaje con el nombre enviado', async () => {
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: 'Mundo' })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(typeof res.body).toBe('object');
      expect(res.body.mensaje).toBeDefined();
      expect(typeof res.body.mensaje).toBe('string');
      expect(res.body.mensaje).toContain('Mundo');
    });

    test('Headers de seguridad: Helmet debe estar activo (x-content-type-options, x-frame-options)', async () => {
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: 'Mundo' })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-frame-options'].length).toBeGreaterThan(0);
    });

    test('Content-Type: la respuesta debe ser application/json', async () => {
      const res = await request(app)
        .get('/api/hola')
        .query({ nombre: 'Mundo' })
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});