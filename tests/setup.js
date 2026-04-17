const jwt = require('jsonwebtoken');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-secret-key-jest';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ALLOWED_ORIGINS = 'http://localhost:3001';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.LOG_LEVEL = 'silent';

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  http: jest.fn(),
}));

jest.setTimeout(10000);

beforeAll(async () => {
  try {
    const app = require('../src/app');
    if (!app) {
      throw new Error('La aplicación retornó un valor nulo o indefinido.');
    }
    global.app = app;
    global.testRequest = request(global.app);
  } catch (err) {
    throw new Error(
      `La aplicación no pudo cargarse en el entorno de pruebas: ${err.message}`
    );
  }
});

afterAll(async () => {
  global.app = undefined;
  global.testRequest = undefined;

  // PUNTO DE EXTENSIÓN: Cuando se integre MongoDB/Mongoose, cerrar la conexión aquí.
  // Ejemplo:
  // const mongoose = require('mongoose');
  // if (mongoose.connection.readyState !== 0) {
  //   await mongoose.connection.close();
  // }
});

beforeEach(() => {
  jest.clearAllMocks();
});

global.generateTestToken = function generateTestToken() {
  return jwt.sign(
    {
      id: 'test-user-id-001',
      email: 'testuser@jest.test',
      role: 'test',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

global.generateExpiredToken = function generateExpiredToken() {
  return jwt.sign(
    {
      id: 'test-user-id-001',
      email: 'testuser@jest.test',
      role: 'test',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '-1s',
    }
  );
};