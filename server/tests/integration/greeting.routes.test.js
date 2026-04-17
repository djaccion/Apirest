const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const Greeting = require('../../models/Greeting');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let mongoServer;
let adminUser;
let authToken;

const greetingFixture = {
  countryCode: 'JP',
  countryName: 'Japan',
  language: 'Japanese',
  greeting: 'Konnichiwa',
  formalGreeting: 'Hajimemashite',
  flagUrl: '/flags/jp.svg',
  isActive: true,
};

const greetingFixtureES = {
  countryCode: 'ES',
  countryName: 'Spain',
  language: 'Spanish',
  greeting: 'Hola',
  formalGreeting: 'Buenos días',
  flagUrl: '/flags/es.svg',
  isActive: true,
};

const invalidGreetingFixture = {
  countryCode: '',
  __proto__: { admin: true },
  malicious: { $gt: '' },
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const passwordHash = await bcrypt.hash('testpassword123', 10);
  adminUser = await User.create({
    username: 'testadmin',
    passwordHash,
    role: 'admin',
  });

  const secret = process.env.JWT_SECRET || 'test-secret-key';
  authToken = jwt.sign(
    { id: adminUser._id, role: 'admin' },
    secret,
    { expiresIn: '1h' }
  );
});

afterEach(async () => {
  await Greeting.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('GET /api/greetings', () => {
  test('1.1 - Respuesta exitosa con array vacío', async () => {
    const response = await request(app).get('/api/greetings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  test('1.2 - Retorna saludos activos correctamente', async () => {
    await Greeting.insertMany([greetingFixture, greetingFixtureES]);
    const response = await request(app).get('/api/greetings');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    response.body.data.forEach((item) => {
      expect(item).toHaveProperty('countryCode');
      expect(item).toHaveProperty('countryName');
      expect(item).toHaveProperty('greeting');
      expect(item).toHaveProperty('flagUrl');
    });
  });

  test('1.3 - No retorna saludos inactivos', async () => {
    await Greeting.insertMany([
      { ...greetingFixture, isActive: false },
      { ...greetingFixtureES, isActive: true },
    ]);
    const response = await request(app).get('/api/greetings');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  test('1.4 - Estructura de respuesta correcta', async () => {
    await Greeting.insertMany([greetingFixture, greetingFixtureES]);
    const response = await request(app).get('/api/greetings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.count).toBe(response.body.data.length);
  });

  test('1.5 - Headers de seguridad presentes', async () => {
    const response = await request(app).get('/api/greetings');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});