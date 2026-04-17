require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('GET /hola - Integration Tests', () => {
  let validToken;
  let expiredToken;
  const invalidToken = 'token.invalido.falso';
  const malformedAuthHeader = 'sin-prefijo-bearer';

  beforeAll(() => {
    validToken = jwt.sign({ sub: 'user_test', iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, {
      expiresIn: '1h',
    });

    expiredToken = jwt.sign({ sub: 'user_test', iat: Math.floor(Date.now() / 1000) }, JWT_SECRET, {
      expiresIn: '-1s',
    });
  });

  afterAll(async () => {
    if (app.close && typeof app.close === 'function') {
      await new Promise((resolve) => app.close(resolve));
    }
  });

  describe('Autenticación y autorización', () => {
    test('Caso 1 - Sin header Authorization retorna 401', async () => {
      const response = await request(app).get('/hola');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          error: expect.any(String),
        }) ||
          expect.objectContaining({
            message: expect.any(String),
          })
      );
      expect(response.body.message || response.body.error).toBeTruthy();
    });

    test('Caso 2 - Token inválido (malformado) retorna 401', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      const bodyText = JSON.stringify(response.body).toLowerCase();
      expect(
        bodyText.includes('invalid') ||
          bodyText.includes('inválido') ||
          bodyText.includes('invalido') ||
          bodyText.includes('token')
      ).toBe(true);
    });

    test('Caso 3 - Token expirado retorna 401 con mensaje de expiración', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      const bodyText = JSON.stringify(response.body).toLowerCase();
      expect(
        bodyText.includes('expir') ||
          bodyText.includes('expired') ||
          bodyText.includes('vencido')
      ).toBe(true);
    });

    test('Caso 4 - Header Authorization sin prefijo Bearer retorna 401', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', malformedAuthHeader);

      expect(response.status).toBe(401);
    });

    test('Caso 5 - Token válido permite el acceso y retorna 200', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Respuesta exitosa (Happy Path)', () => {
    test('Caso 6 - Estructura del body con token válido', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
      expect(
        response.body.message === 'Hola Mundo' ||
          typeof response.body.message === 'string'
      ).toBe(true);
    });

    test('Caso 7 - El campo message es un string no vacío', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  describe('Headers de Seguridad (Helmet)', () => {
    test('Caso 8 - Presencia de headers de seguridad HTTP', async () => {
      const response = await request(app)
        .get('/hola')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('strict-transport-security');
    });
  });

  describe('Rate Limiting', () => {
    test.skip(
      'Caso 9 - Respeta el límite de requests por IP (requiere configuración específica del entorno de test con límite bajo, ej. 5 req)',
      async () => {
        const limit = 5;
        const requests = [];

        for (let i = 0; i <= limit; i++) {
          requests.push(request(app).get('/hola'));
        }

        const responses = await Promise.all(requests);
        const lastResponse = responses[responses.length - 1];

        expect(lastResponse.status).toBe(429);
      }
    );
  });

  describe('Validación de Entrada', () => {
    test('Caso 10 - Query params inesperados no rompen el endpoint y no reflejan input malicioso', async () => {
      const maliciousScript = '<script>alert(1)</script>';
      const response = await request(app)
        .get(`/hola?foo=bar&script=${encodeURIComponent(maliciousScript)}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).not.toBe(500);
      expect([200, 400, 422]).toContain(response.status);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('alert(1)');
    });
  });
});