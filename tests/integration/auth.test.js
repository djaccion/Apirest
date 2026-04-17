/**
 * @file tests/integration/auth.test.js
 * @ticket XP-9
 * @type Integration Test
 * @description Pruebas de integración para el endpoint POST /api/v1/auth/token
 */

require('dotenv').config({ path: '.env.test' });
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: '.env' });
}

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

const TEST_CREDENTIALS = {
  username: process.env.TEST_USERNAME || 'testuser',
  password: process.env.TEST_PASSWORD || 'testpassword123',
};

const JWT_SECRET = process.env.JWT_SECRET || 'default_test_secret';
const AUTH_ENDPOINT = '/api/v1/auth/token';

describe('Auth Integration Tests', () => {
  let server;

  beforeAll((done) => {
    jest.setTimeout(10000);
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('POST /api/v1/auth/token', () => {
    it('should return 200 and a valid JWT token when credentials are correct', async () => {
      const response = await request(server)
        .post(AUTH_ENDPOINT)
        .set('Content-Type', 'application/json')
        .send(TEST_CREDENTIALS);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body).toHaveProperty('expiresIn');

      const decoded = jwt.decode(response.body.token);
      expect(decoded).not.toBeNull();
      expect(decoded).toEqual(
        expect.objectContaining(
          decoded.sub
            ? { sub: expect.anything() }
            : { userId: expect.anything() }
        )
      );

      const verified = jwt.verify(response.body.token, JWT_SECRET);
      expect(verified).not.toBeNull();
    });

    it('should return 400 or 422 and validation errors when body is empty', async () => {
      const response = await request(server)
        .post(AUTH_ENDPOINT)
        .set('Content-Type', 'application/json')
        .send({});

      expect([400, 422]).toContain(response.status);

      const hasErrors =
        response.body.hasOwnProperty('errors') ||
        response.body.hasOwnProperty('message');
      expect(hasErrors).toBe(true);
    });

    it('should return 400 or 422 and validation errors when required fields are missing', async () => {
      const response = await request(server)
        .post(AUTH_ENDPOINT)
        .set('Content-Type', 'application/json')
        .send({ username: TEST_CREDENTIALS.username });

      expect([400, 422]).toContain(response.status);

      const hasErrors =
        response.body.hasOwnProperty('errors') ||
        response.body.hasOwnProperty('message');
      expect(hasErrors).toBe(true);
    });

    it('should return an error or handle gracefully when Content-Type is not application/json', async () => {
      const response = await request(server)
        .post(AUTH_ENDPOINT)
        .set('Content-Type', 'text/plain')
        .send('username=testuser&password=testpassword123');

      expect([400, 415, 422]).toContain(response.status);
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should include Helmet security headers in the response', async () => {
      const response = await request(server)
        .post(AUTH_ENDPOINT)
        .set('Content-Type', 'application/json')
        .send(TEST_CREDENTIALS);

      expect(response.status).toBe(200);

      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
      ];

      const presentHeaders = securityHeaders.filter(
        (header) => response.headers[header] !== undefined
      );

      expect(presentHeaders.length).toBeGreaterThan(0);
    });

    it('should return 200 for multiple consecutive requests without being rate limited under normal conditions', async () => {
      const numberOfRequests = 5;
      const responses = [];

      for (let i = 0; i < numberOfRequests; i++) {
        const response = await request(server)
          .post(AUTH_ENDPOINT)
          .set('Content-Type', 'application/json')
          .send(TEST_CREDENTIALS);
        responses.push(response);
      }

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
      });
    });
  });
});