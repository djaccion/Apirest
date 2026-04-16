const request = require('supertest');
const bcrypt = require('bcrypt');

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(null),
    quit: jest.fn().mockResolvedValue(null),
  }));
});

jest.mock('amqplib', () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn().mockResolvedValue(null),
      sendToQueue: jest.fn().mockResolvedValue(null),
      close: jest.fn().mockResolvedValue(null),
    }),
    close: jest.fn().mockResolvedValue(null),
  }),
}));

const app = require('../../src/app');
const db = require('../../src/database');

describe('Users API Integration Tests', () => {
  let adminId;
  let adminToken;

  beforeAll(async () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const passwordHash = await bcrypt.hash('AdminPass123!', 12);

    const stmt = db.prepare(
      `INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run('admin_test', passwordHash, 'admin', 'admin@test.com');
    adminId = result.lastInsertRowid;
  });

  beforeEach(() => {
    db.prepare(`DELETE FROM users WHERE id != ?`).run(adminId);
  });

  afterAll(() => {
    db.close();
    jest.restoreAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    test('Login exitoso con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin_test', password: 'AdminPass123!' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body).toHaveProperty('expiresIn');

      adminToken = response.body.token;

      const segments = adminToken.split('.');
      expect(segments).toHaveLength(3);
    });

    test('Login con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin_test', password: 'WrongPassword' });

      expect(response.status).toBe(401);
      expect(
        response.body.error || response.body.message
      ).toBeTruthy();
    });

    test('Login con usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'noexiste', password: 'cualquier' });

      expect(response.status).toBe(401);
    });

    test('Login con body incompleto (sin password)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin_test' });

      expect(response.status).toBe(400);
    });

    test('Login con body vacío', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/users', () => {
    test('Crear usuario exitosamente con rol admin', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'new_viewer',
          email: 'viewer@test.com',
          password: 'ViewerPass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', 'new_viewer');
      expect(response.body).toHaveProperty('email', 'viewer@test.com');
      expect(response.body).toHaveProperty('role', 'viewer');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('Crear usuario sin token de autenticación', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          username: 'unauthorized_user',
          email: 'unauth@test.com',
          password: 'SomePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(401);
    });

    test('Crear usuario con token inválido', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', 'Bearer tokeninvalido.abc.xyz')
        .send({
          username: 'invalid_token_user',
          email: 'invalid@test.com',
          password: 'SomePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(401);
    });

    test('Crear usuario con username duplicado', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'duplicate_user',
          email: 'dup1@test.com',
          password: 'DupPass123!',
          role: 'viewer',
        });

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'duplicate_user',
          email: 'dup2@test.com',
          password: 'DupPass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(409);
    });

    test('Crear usuario con email duplicado', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user_email1',
          email: 'same@test.com',
          password: 'SamePass123!',
          role: 'viewer',
        });

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user_email2',
          email: 'same@test.com',
          password: 'SamePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(409);
    });

    test('Crear usuario con body incompleto (sin email)', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'incomplete_user',
          password: 'SomePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(400);
    });

    test('Crear usuario con body incompleto (sin username)', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nousername@test.com',
          password: 'SomePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(400);
    });

    test('Crear usuario con body incompleto (sin password)', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'nopassword_user',
          email: 'nopassword@test.com',
          role: 'viewer',
        });

      expect(response.status).toBe(400);
    });

    test('Crear usuario con rol inválido', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalid_role_user',
          email: 'invalidrole@test.com',
          password: 'SomePass123!',
          role: 'superadmin',
        });

      expect(response.status).toBe(400);
    });

    test('Crear usuario con email inválido', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalid_email_user',
          email: 'not-an-email',
          password: 'SomePass123!',
          role: 'viewer',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/users', () => {
    test('Listar usuarios exitosamente con token admin', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'list_user1',
          email: 'list1@test.com',
          password: 'ListPass123!',
          role: 'viewer',
        });

      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'list_user2',
          email: 'list2@test.com',
          password: 'ListPass123!',
          role: 'viewer',
        });

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      response.body.forEach((user) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('password_hash');
      });
    });

    test('Listar usuarios sin token de autenticación', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(401);
    });

    test('Listar usuarios con token inválido', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer tokeninvalido.abc.xyz');

      expect(response.status).toBe(401);
    });

    test('Listar usuarios retorna array vacío cuando no hay usuarios adicionales', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('Obtener usuario por ID existente', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'get_by_id_user',
          email: 'getbyid@test.com',
          password: 'GetPass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdId);
      expect(response.body).toHaveProperty('username', 'get_by_id_user');
      expect(response.body).toHaveProperty('email', 'getbyid@test.com');
      expect(response.body).toHaveProperty('role', 'viewer');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('Obtener usuario con ID inexistente', async () => {
      const response = await request(app)
        .get('/api/v1/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('Obtener usuario sin token de autenticación', async () => {
      const response = await request(app).get(`/api/v1/users/${adminId}`);

      expect(response.status).toBe(401);
    });

    test('Obtener usuario con ID no numérico', async () => {
      const response = await request(app)
        .get('/api/v1/users/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404]).toContain(response.status);
    });

    test('Obtener usuario con token inválido', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${adminId}`)
        .set('Authorization', 'Bearer tokeninvalido.abc.xyz');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    test('Actualizar usuario exitosamente', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'update_user',
          email: 'update@test.com',
          password: 'UpdatePass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updated_username',
          email: 'updated@test.com',
          role: 'viewer',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdId);
      expect(response.body).toHaveProperty('username', 'updated_username');
      expect(response.body).toHaveProperty('email', 'updated@test.com');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    test('Actualizar usuario con ID inexistente', async () => {
      const response = await request(app)
        .put('/api/v1/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'ghost_user',
          email: 'ghost@test.com',
          role: 'viewer',
        });

      expect(response.status).toBe(404);
    });

    test('Actualizar usuario sin token de autenticación', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${adminId}`)
        .send({
          username: 'no_auth_update',
          email: 'noauth@test.com',
          role: 'viewer',
        });

      expect(response.status).toBe(401);
    });

    test('Actualizar usuario con email duplicado', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_user1',
          email: 'put1@test.com',
          password: 'PutPass123!',
          role: 'viewer',
        });

      const createResponse2 = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_user2',
          email: 'put2@test.com',
          password: 'PutPass123!',
          role: 'viewer',
        });

      const id2 = createResponse2.body.id;

      const response = await request(app)
        .put(`/api/v1/users/${id2}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_user2_renamed',
          email: 'put1@test.com',
          role: 'viewer',
        });

      expect(response.status).toBe(409);
    });

    test('Actualizar usuario con body inválido (email malformado)', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_invalid_email',
          email: 'putemail@test.com',
          password: 'PutPass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_invalid_email',
          email: 'not-an-email',
          role: 'viewer',
        });

      expect(response.status).toBe(400);
    });

    test('Actualizar contraseña del usuario', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_password_user',
          email: 'putpassword@test.com',
          password: 'OldPass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'put_password_user',
          email: 'putpassword@test.com',
          password: 'NewPass456!',
          role: 'viewer',
        });

      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('Eliminar usuario exitosamente', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'delete_user',
          email: 'delete@test.com',
          password: 'DeletePass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app)
        .get(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    test('Eliminar usuario con ID inexistente', async () => {
      const response = await request(app)
        .delete('/api/v1/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    test('Eliminar usuario sin token de autenticación', async () => {
      const response = await request(app).delete(`/api/v1/users/${adminId}`);

      expect(response.status).toBe(401);
    });

    test('Eliminar usuario con token inválido', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${adminId}`)
        .set('Authorization', 'Bearer tokeninvalido.abc.xyz');

      expect(response.status).toBe(401);
    });

    test('Eliminar usuario con ID no numérico', async () => {
      const response = await request(app)
        .delete('/api/v1/users/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404]).toContain(response.status);
    });

    test('Eliminar usuario verifica que ya no aparece en el listado', async () => {
      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'delete_list_user',
          email: 'deletelist@test.com',
          password: 'DeletePass123!',
          role: 'viewer',
        });

      const createdId = createResponse.body.id;

      await request(app)
        .delete(`/api/v1/users/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const listResponse = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listResponse.status).toBe(200);
      const ids = listResponse.body.map((u) => u.id);
      expect(ids).not.toContain(createdId);
    });
  });
});