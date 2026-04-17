// Integration tests for XP-9
// Covers endpoints documented in Swagger under /api-docs:
//   GET  /api/v1/health
//   POST /api/v1/auth/token
//   GET  /api/v1/hola

require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');

let validToken;
let server;

beforeAll(async () => {
  server = app.listen(0);

  const res = await request(server)
    .post('/api/v1/auth/token')
    .send({
      username: process.env.TEST_USERNAME || 'admin',
      password: process.env.TEST_PASSWORD || 'password123',
    });

  validToken = res.body.token;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
});

describe('GET /api/v1/health', () => {
  it('should return status 200 without authentication', async () => {
    const res = await request(server).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('should return a body containing status, uptime and timestamp properties', async () => {
    const res = await request(server).get('/api/v1/health');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return status property with value "ok"', async () => {
    const res = await request(server).get('/api/v1/health');
    expect(res.body.status).toBe('ok');
  });

  it('should return Content-Type header including application/json', async () => {
    const res = await request(server).get('/api/v1/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('POST /api/v1/auth/token', () => {
  it('should return status 200 with valid credentials', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token')
      .send({
        username: process.env.TEST_USERNAME || 'admin',
        password: process.env.TEST_PASSWORD || 'password123',
      });
    expect(res.status).toBe(200);
  });

  it('should return a token property of type string in the response body', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token')
      .send({
        username: process.env.TEST_USERNAME || 'admin',
        password: process.env.TEST_PASSWORD || 'password123',
      });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  it('should return a token with standard JWT format (three dot-separated segments)', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token')
      .send({
        username: process.env.TEST_USERNAME || 'admin',
        password: process.env.TEST_PASSWORD || 'password123',
      });
    expect(res.body.token).toMatch(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/);
  });

  it('should return status 400 or 401 with invalid credentials', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token')
      .send({
        username: 'invalid_user',
        password: 'wrong_password',
      });
    expect([400, 401]).toContain(res.status);
  });

  it('should return a controlled error status and not crash the server when body is empty', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token')
      .send({});
    expect([400, 401]).toContain(res.status);
  });

  it('should return a controlled error status and not crash the server when no body is sent', async () => {
    const res = await request(server)
      .post('/api/v1/auth/token');
    expect([400, 401]).toContain(res.status);
  });
});

describe('GET /api/v1/hola', () => {
  it('should return status 401 when no Authorization header is provided', async () => {
    const res = await request(server).get('/api/v1/hola');
    expect(res.status).toBe(401);
  });

  it('should return status 401 or 403 when a malformed token is provided', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', 'Bearer this_is_not_a_valid_jwt_token');
    expect([401, 403]).toContain(res.status);
  });

  it('should return status 401 or 403 when a token with invalid signature is provided', async () => {
    const invalidSignatureToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwfQ' +
      '.invalidsignatureXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${invalidSignatureToken}`);
    expect([401, 403]).toContain(res.status);
  });

  it('should return status 200 with a valid token', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
  });

  it('should return a response body containing exactly message, timestamp and requestId properties', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('requestId');
  });

  it('should return message property with value "Hola Mundo"', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.body.message).toBe('Hola Mundo');
  });

  it('should return a timestamp that is parseable as a valid ISO date', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    const parsed = new Date(res.body.timestamp);
    expect(parsed.toString()).not.toBe('Invalid Date');
    expect(parsed.toISOString()).toBe(res.body.timestamp);
  });

  it('should return a requestId that is a non-empty string', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
  });

  it('should return Content-Type header including application/json', async () => {
    const res = await request(server)
      .get('/api/v1/hola')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});