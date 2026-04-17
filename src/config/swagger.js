const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Configuración Swagger/OpenAPI 3.0
 * Propósito: Centralizar la configuración de documentación de la API
 * Versión OpenAPI: 3.0.0
 * Trazabilidad: Ticket Jira XP-9
 */

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API RESTful Node.js - XP-9',
    version: process.env.npm_package_version || '1.0.0',
    description:
      'API RESTful con autenticación JWT construida con Express.js. ' +
      'Referencia ticket Jira XP-9. Implementa seguridad DevSecOps con helmet, cors y rate limiting.',
    contact: {
      name: 'Equipo de Desarrollo',
      email: 'dev-team@example.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:3000',
      description: 'Servidor de Desarrollo',
    },
    ...(process.env.API_PROD_URL
      ? [
          {
            url: process.env.API_PROD_URL,
            description: 'Servidor de Producción',
          },
        ]
      : []),
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      HolaMundoResponse: {
        type: 'object',
        required: ['message', 'timestamp', 'requestId'],
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          requestId: { type: 'string' },
        },
      },
      TokenRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
        example: {
          username: 'testuser',
          password: 'testpassword',
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          expiresIn: { type: 'string' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          uptime: { type: 'number' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          statusCode: { type: 'number' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Token JWT inválido o no proporcionado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      TooManyRequests: {
        description: 'Límite de requests excedido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Endpoint público de verificación de salud del servicio',
    },
    {
      name: 'Auth',
      description: 'Generación y gestión de tokens JWT para autenticación',
    },
    {
      name: 'Hola Mundo',
      description: 'Endpoint principal protegido con autenticación JWT',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
  customSiteTitle: 'API RESTful Node.js - XP-9',
  explorer: true,
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions,
};