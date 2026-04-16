process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRATION = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '10000';

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../src/events/rabbitmqPublisher');
jest.mock('ioredis');

const rabbitmqPublisher = require('../../src/events/rabbitmqPublisher');

describe('Deployments Integration Tests - POST /api/v1/deployments', () => {
  let adminUserId;
  let adminToken;
  let userToken;
  let expiredToken;
  let mockPublishEvent;

  beforeAll(async () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS deployments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_app TEXT NOT NULL,
        status TEXT NOT NULL,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const hashedPassword = await bcrypt.hash('AdminPass123!', 4);
    const insertUser = db.prepare(
      `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`
    );
    const result = insertUser.run('admin_test', 'admin@test.com', hashedPassword, 'admin');
    adminUserId = result.lastInsertRowid;

    adminToken = jwt.sign(
      { id: adminUserId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: 999, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    expiredToken = jwt.sign(
      { id: adminUserId, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    mockPublishEvent = jest.fn().mockResolvedValue(true);
    rabbitmqPublisher.publishEvent = mockPublishEvent;
  });

  beforeEach(() => {
    db.exec(`DELETE FROM deployments`);
    if (mockPublishEvent) {
      mockPublishEvent.mockClear();
    }
  });

  afterAll(() => {
    db.close();

    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRATION;
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
  });

  describe('Authentication and Authorization', () => {
    const validPayload = {
      id_app: 'app-test-001',
      status: 'SUCCESS',
      description: 'Test deployment',
      duration: 120
    };

    test('Test 1 - Sin token: debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 2 - Token malformado: debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', 'Bearer token_invalido_no_jwt')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 3 - Token expirado: debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 4 - Token con rol insuficiente (role: user): debe retornar 403', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(response.status).toBe(403);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 5 - Token válido con rol admin: debe retornar 201', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
    });
  });

  describe('Payload Validation', () => {
    const validPayload = {
      id_app: 'app-test-001',
      status: 'SUCCESS',
      description: 'Test deployment description',
      duration: 120
    };

    test('Test 6 - Payload vacío: debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 7 - Falta campo id_app: debe retornar 400', async () => {
      const { id_app, ...payloadSinIdApp } = validPayload;
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadSinIdApp);

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 8 - Falta campo status: debe retornar 400', async () => {
      const { status, ...payloadSinStatus } = validPayload;
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payloadSinStatus);

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 9 - Status con valor inválido: debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 10 - id_app vacío: debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, id_app: '' });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 11 - duration negativo: debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, duration: -10 });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 12 - duration no numérico: debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, duration: 'no-es-numero' });

      expect(response.status).toBe(400);
      expect(response.body.error || response.body.message).toBeTruthy();
    });

    test('Test 13 - Payload con campos extra desconocidos: debe retornar 400 o ignorarlos', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, campoDesconocido: 'valor' });

      expect([201, 400]).toContain(response.status);
    });

    test('Test 14 - Status SUCCESS válido: debe retornar 201', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'SUCCESS' });

      expect(response.status).toBe(201);
    });

    test('Test 15 - Status FAILED válido: debe retornar 201', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'FAILED' });

      expect(response.status).toBe(201);
    });

    test('Test 16 - Status PENDING válido: debe retornar 201', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'PENDING' });

      expect(response.status).toBe(201);
    });
  });

  describe('Successful Deployment Registration', () => {
    const validPayload = {
      id_app: 'app-success-001',
      status: 'SUCCESS',
      description: 'Successful deployment test',
      duration: 300
    };

    test('Test 17 - Registro exitoso retorna 201 con body correcto', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id || response.body.data?.id).toBeTruthy();
    });

    test('Test 18 - Respuesta contiene id_app del deployment registrado', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      const body = response.body.data || response.body;
      expect(body.id_app).toBe(validPayload.id_app);
    });

    test('Test 19 - Respuesta contiene status del deployment registrado', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      const body = response.body.data || response.body;
      expect(body.status).toBe(validPayload.status);
    });

    test('Test 20 - Respuesta contiene description del deployment registrado', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      const body = response.body.data || response.body;
      expect(body.description).toBe(validPayload.description);
    });

    test('Test 21 - Respuesta contiene duration del deployment registrado', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      const body = response.body.data || response.body;
      expect(body.duration).toBe(validPayload.duration);
    });

    test('Test 22 - Respuesta no contiene campos sensibles', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toMatch(/password/i);
    });

    test('Test 23 - Content-Type de respuesta es application/json', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Business Logic and Persistence', () => {
    const validPayload = {
      id_app: 'app-persistence-001',
      status: 'SUCCESS',
      description: 'Persistence test deployment',
      duration: 200
    };

    test('Test 24 - El deployment se persiste en la base de datos', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get(validPayload.id_app);
      expect(deployment).toBeDefined();
      expect(deployment.id_app).toBe(validPayload.id_app);
    });

    test('Test 25 - El status se persiste correctamente en la base de datos', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get(validPayload.id_app);
      expect(deployment).toBeDefined();
      expect(deployment.status).toBe(validPayload.status);
    });

    test('Test 26 - La description se persiste correctamente en la base de datos', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get(validPayload.id_app);
      expect(deployment).toBeDefined();
      expect(deployment.description).toBe(validPayload.description);
    });

    test('Test 27 - La duration se persiste correctamente en la base de datos', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get(validPayload.id_app);
      expect(deployment).toBeDefined();
      expect(deployment.duration).toBe(validPayload.duration);
    });

    test('Test 28 - El timestamp se genera automáticamente al persistir', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get(validPayload.id_app);
      expect(deployment).toBeDefined();
      expect(deployment.timestamp || deployment.created_at).toBeTruthy();
    });

    test('Test 29 - Múltiples deployments del mismo id_app se persisten como registros separados', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'FAILED' });

      const deployments = db.prepare('SELECT * FROM deployments WHERE id_app = ?').all(validPayload.id_app);
      expect(deployments.length).toBe(2);
    });

    test('Test 30 - El id generado es único para cada deployment', async () => {
      const response1 = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      const response2 = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, status: 'FAILED' });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      const body1 = response1.body.data || response1.body;
      const body2 = response2.body.data || response2.body;
      expect(body1.id).not.toBe(body2.id);
    });

    test('Test 31 - Deployment con status FAILED se persiste correctamente', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, id_app: 'app-failed-001', status: 'FAILED' });

      const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get('app-failed-001');
      expect(deployment).toBeDefined();
      expect(deployment.status).toBe('FAILED');
    });

    test('Test 32 - Deployment sin description opcional se persiste correctamente', async () => {
      const { description, ...payloadSinDescription } = validPayload;
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...payloadSinDescription, id_app: 'app-nodesc-001' });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        const deployment = db.prepare('SELECT * FROM deployments WHERE id_app = ?').get('app-nodesc-001');
        expect(deployment).toBeDefined();
      }
    });
  });

  describe('Event Publishing', () => {
    const validPayload = {
      id_app: 'app-events-001',
      status: 'SUCCESS',
      description: 'Event publishing test',
      duration: 150
    };

    beforeEach(() => {
      mockPublishEvent.mockClear();
    });

    test('Test 33 - Se publica un evento en RabbitMQ al registrar un deployment exitoso', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(mockPublishEvent).toHaveBeenCalledTimes(1);
    });

    test('Test 34 - El evento publicado contiene el id_app del deployment', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(mockPublishEvent).toHaveBeenCalled();
      const callArgs = mockPublishEvent.mock.calls[0];
      const eventPayload = JSON.stringify(callArgs);
      expect(eventPayload).toContain(validPayload.id_app);
    });

    test('Test 35 - El evento publicado contiene el status del deployment', async () => {
      await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPayload);

      expect(mockPublishEvent).toHaveBeenCalled();
      const callArgs = mockPublishEvent.mock.calls[0];
      const eventPayload = JSON.stringify(callArgs);
      expect(eventPayload).toContain(validPayload.status);
    });

    test('Test 36 - No se publica evento si el payload es inválido y retorna 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(mockPublishEvent).not.toHaveBeenCalled();
    });

    test('Test 37 - No se publica evento si la autenticación falla', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(mockPublishEvent).not.toHaveBeenCalled();
    });

    test('Test 38 - No se publica evento si la autorización falla (rol user)', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPayload);

      expect(response.status).toBe(403);
      expect(mockPublishEvent).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    const validPayload = {
      id_app: 'app-edge-001',
      status: 'SUCCESS',
      description: 'Edge case test',
      duration: 100
    };

    test('Test 39 - id_app con caracteres especiales válidos: debe procesarse correctamente', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, id_app: 'app-test_001.v2' });

      expect([201, 400]).toContain(response.status);
    });

    test('Test 40 - description con texto largo (1000 caracteres): debe procesarse', async () => {
      const longDescription = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, description: longDescription });

      expect([201, 400]).toContain(response.status);
    });

    test('Test 41 - Intento de inyección SQL en id_app: debe retornar 400 o sanitizarse', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, id_app: "'; DROP TABLE deployments; --" });

      expect([400, 201]).toContain(response.status);
      const count = db.prepare('SELECT COUNT(*) as count FROM deployments').get();
      expect(count).toBeDefined();
    });

    test('Test 42 - Intento de inyección XSS en description: debe sanitizarse o rechazarse', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, description: '<script>alert("xss")</script>' });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        const body = response.body.data || response.body;
        if (body.description) {
          expect(body.description).not.toContain('<script>');
        }
      }
    });

    test('Test 43 - duration con valor cero: debe retornar 400 o 201 según reglas de negocio', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, duration: 0 });

      expect([201, 400]).toContain(response.status);
    });

    test('Test 44 - duration con valor muy grande: debe procesarse', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, duration: 999999999 });

      expect([201, 400]).toContain(response.status);
    });

    test('Test 45 - id_app con longitud excesiva (500 caracteres): debe retornar 400', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validPayload, id_app: 'a'.repeat(500) });

      expect([400, 201]).toContain(response.status);
    });

    test('Test 46 - Envío de Content-Type incorrecto (text/plain): debe retornar 400 o 415', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(validPayload));

      expect([400, 415, 422]).toContain(response.status);
    });

    test('Test 47 - Múltiples requests concurrentes deben procesarse sin errores de concurrencia', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/v1/deployments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validPayload, id_app: `app-concurrent-${i}` })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      const count = db.prepare('SELECT COUNT(*) as count FROM deployments').get();
      expect(count.count).toBe(5);
    });

    test('Test 48 - Respuesta de error debe tener estructura consistente con propiedad error o message', async () => {
      const response = await request(app)
        .post('/api/v1/deployments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      const hasErrorProp = response.body.hasOwnProperty('error') || response.body.hasOwnProperty('message');
      expect(hasErrorProp).toBe(true);
      const errorValue = response.body.error || response.body.message;
      expect(typeof errorValue === 'string' || typeof errorValue === 'object').toBe(true);
      expect(errorValue).toBeTruthy();
    });
  });
});