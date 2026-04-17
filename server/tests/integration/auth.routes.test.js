const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let User;
let mongoServer;

const TEST_ADMIN = {
  username: 'testadmin',
  password: 'TestPassword123!',
  role: 'admin',
};

const TEST_VIEWER = {
  username: 'testviewer',
  password: 'ViewerPassword123!',
  role: 'viewer',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-integration-tests';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-for-integration-tests';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(uri);

  app = require('../../app');
  User = require('../../models/User');

  const adminPasswordHash = await bcrypt.hash(TEST_ADMIN.password, 10);
  await User.create({
    username: TEST_ADMIN.username,
    passwordHash: adminPasswordHash,
    role: TEST_ADMIN.role,
    createdAt: new Date(),
  });

  const viewerPasswordHash = await bcrypt.hash(TEST_VIEWER.password, 10);
  await User.create({
    username: TEST_VIEWER.username,
    passwordHash: viewerPasswordHash,
    role: TEST_VIEWER.role,
    createdAt: new Date(),
  });
});

afterEach(async () => {
  await User.deleteMany({
    username: { $nin: [TEST_ADMIN.username, TEST_VIEWER.username] },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/auth/login', () => {
  test('Test 1 - Login exitoso con credenciales válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password })
      .expect('Content-Type', /application\/json/)
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
    expect(response.body).toHaveProperty('refreshToken');
    expect(typeof response.body.refreshToken).toBe('string');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username', TEST_ADMIN.username);
    expect(response.body.user).toHaveProperty('role', TEST_ADMIN.role);
    expect(response.body.user).not.toHaveProperty('passwordHash');

    const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('role', TEST_ADMIN.role);
  });

  test('Test 2 - Login con contraseña incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: 'WrongPassword999!' })
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message.length).toBeGreaterThan(0);
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('refreshToken');
  });

  test('Test 3 - Login con usuario inexistente (prevención de user enumeration)', async () => {
    const startNonExistent = Date.now();
    const responseNonExistent = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistentuser99', password: 'SomePassword123!' });
    const timeNonExistent = Date.now() - startNonExistent;

    expect(responseNonExistent.status).toBe(401);
    expect(responseNonExistent.body).toHaveProperty('message');

    const startWrongPass = Date.now();
    const responseWrongPass = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: 'WrongPassword999!' });
    const timeWrongPass = Date.now() - startWrongPass;

    expect(responseWrongPass.status).toBe(401);

    expect(responseNonExistent.body.message).toBe(responseWrongPass.body.message);

    const timeDifference = Math.abs(timeNonExistent - timeWrongPass);
    expect(timeDifference).toBeLessThan(500);
  });

  test('Test 4 - Login con body vacío', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);

    const errorFields = response.body.errors.map((e) => e.param || e.field || e.path);
    expect(errorFields).toEqual(expect.arrayContaining(['username', 'password']));
  });

  test('Test 5 - Login con campos faltantes (solo username)', async () => {
    const responseNoPassword = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username })
      .expect(400);

    expect(responseNoPassword.body).toHaveProperty('errors');
    expect(Array.isArray(responseNoPassword.body.errors)).toBe(true);
    const noPassFields = responseNoPassword.body.errors.map((e) => e.param || e.field || e.path);
    expect(noPassFields).toContain('password');

    const responseNoUsername = await request(app)
      .post('/api/auth/login')
      .send({ password: TEST_ADMIN.password })
      .expect(400);

    expect(responseNoUsername.body).toHaveProperty('errors');
    expect(Array.isArray(responseNoUsername.body.errors)).toBe(true);
    const noUserFields = responseNoUsername.body.errors.map((e) => e.param || e.field || e.path);
    expect(noUserFields).toContain('username');
  });

  test('Test 6 - Login con inputs maliciosos XSS', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: xssPayload, password: 'SomePassword123!' });

    expect([400, 401]).toContain(response.status);

    const responseBody = JSON.stringify(response.body);
    expect(responseBody).not.toContain('<script>');
    expect(responseBody).not.toContain('alert("xss")');
    expect(responseBody).not.toMatch(/<script[\s\S]*?>/i);
  });

  test('Test 7 - Login con intento de NoSQL Injection', async () => {
    const injectionPayload = { $gt: '' };

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: injectionPayload, password: { $gt: '' } });

    expect(response.status).toBe(400);
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('refreshToken');

    const responseNeInjection = await request(app)
      .post('/api/auth/login')
      .send({ username: { $ne: null }, password: { $ne: null } });

    expect(responseNeInjection.status).toBe(400);
    expect(responseNeInjection.body).not.toHaveProperty('token');
  });

  test('Test 8 - Rate limiting en login', async () => {
    const attempts = [];
    for (let i = 0; i < 12; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '192.168.1.100')
        .send({ username: 'nonexistent', password: 'wrongpassword' });
      attempts.push(response);
    }

    const rateLimitedResponses = attempts.filter((r) => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    const lastResponse = attempts[attempts.length - 1];
    if (lastResponse.status === 429) {
      expect(lastResponse.body).toHaveProperty('message');
      const retryAfterHeader = lastResponse.headers['retry-after'];
      expect(retryAfterHeader).toBeDefined();
    }
  });
});

describe('POST /api/auth/refresh', () => {
  test('Test 9 - Refresh token válido', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password })
      .expect(200);

    const { refreshToken, token: originalToken } = loginResponse.body;
    expect(refreshToken).toBeDefined();

    const originalDecoded = jwt.decode(originalToken);

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('token');
    expect(typeof refreshResponse.body.token).toBe('string');

    const newDecoded = jwt.decode(refreshResponse.body.token);
    expect(newDecoded.exp).toBeGreaterThanOrEqual(originalDecoded.exp);
  });

  test('Test 10 - Refresh token inválido o manipulado', async () => {
    const manipulatedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlSWQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MDAwMDAwMDB9.invalidsignature';

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: manipulatedToken })
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body).not.toHaveProperty('token');
  });

  test('Test 11 - Refresh token expirado', async () => {
    const expiredRefreshToken = jwt.sign(
      { userId: new mongoose.Types.ObjectId().toString(), role: 'admin' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: -1 }
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredRefreshToken })
      .expect(401);

    expect(response.body).toHaveProperty('message');
    expect(response.body).not.toHaveProperty('token');
  });

  test('Test 12 - Refresh sin token en body', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
    const errorFields = response.body.errors.map((e) => e.param || e.field || e.path);
    expect(errorFields).toContain('refreshToken');
  });
});

describe('POST /api/auth/logout', () => {
  test('Test 13 - Logout con token válido', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password })
      .expect(200);

    const { token } = loginResponse.body;

    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(logoutResponse.body).toHaveProperty('message');
    expect(typeof logoutResponse.body.message).toBe('string');
    expect(logoutResponse.body.message.length).toBeGreaterThan(0);
  });

  test('Test 14 - Logout sin autenticación', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });
});

describe('Seguridad de Headers', () => {
  test('Las respuestas incluyen headers de seguridad de Helmet', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password });

    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers['x-content-type-options']).toBe('nosniff');

    expect(response.headers).toHaveProperty('x-frame-options');

    expect(response.headers).not.toHaveProperty('x-powered-by');
  });

  test('Content-Type es application/json en todas las respuestas de auth', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password });

    expect(loginResponse.headers['content-type']).toMatch(/application\/json/);

    const invalidResponse = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(invalidResponse.headers['content-type']).toMatch(/application\/json/);
  });

  test('No se exponen headers sensibles del servidor', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password });

    expect(response.headers).not.toHaveProperty('x-powered-by');
    expect(response.headers).not.toHaveProperty('server');
  });

  test('CORS headers están presentes y configurados correctamente', async () => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', allowedOrigin)
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password });

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('Solicitudes desde origen no permitido son rechazadas por CORS', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://malicious-site.com')
      .send({ username: TEST_ADMIN.username, password: TEST_ADMIN.password });

    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      expect(corsHeader).not.toBe('http://malicious-site.com');
    }
  });
});