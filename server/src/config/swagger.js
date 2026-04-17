/**
 * @file swagger.js
 * @description Configuración centralizada de Swagger/OpenAPI 3.0 para Tsoft Greetings API.
 *              Forma parte del proyecto XP-10. Consumir únicamente cuando ENABLE_DOCS=true.
 * @module config/swagger
 * @author Tsoft Support
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Tsoft Greetings API',
      version: process.env.API_VERSION || '1.0.0',
      description: 'API REST para gestión de saludos internacionales por país e idioma. Permite consultar, crear, actualizar y eliminar saludos asociados a países y sus respectivos idiomas.',
      contact: {
        name: 'Tsoft Support',
        email: process.env.SUPPORT_EMAIL,
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: process.env.PROD_URL,
        description: 'Producción',
      },
      {
        url: process.env.STAGING_URL,
        description: 'Staging',
      },
      {
        url: `http://localhost:${process.env.PORT || '5000'}`,
        description: 'Desarrollo local',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT con expiración de 1 hora. Se obtiene desde el endpoint de login del panel de administración.',
        },
      },
      schemas: {
        Greeting: {
          type: 'object',
          required: ['countryCode', 'countryName', 'language', 'greeting'],
          properties: {
            countryCode: { type: 'string', example: 'MX' },
            countryName: { type: 'string' },
            language: { type: 'string' },
            greeting: { type: 'string' },
            formalGreeting: { type: 'string' },
            flagUrl: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean' },
          },
        },
        GreetingInput: {
          type: 'object',
          required: ['countryCode', 'countryName', 'language', 'greeting'],
          properties: {
            countryCode: { type: 'string', example: 'MX' },
            countryName: { type: 'string' },
            language: { type: 'string' },
            greeting: { type: 'string' },
            formalGreeting: { type: 'string' },
            flagUrl: { type: 'string', format: 'uri' },
          },
        },
        User: {
          type: 'object',
          properties: {
            username: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'viewer'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            uptime: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' },
            database: { type: 'string', enum: ['connected', 'disconnected'] },
          },
        },
      },
    },
    tags: [
      { name: 'Greetings', description: 'Operaciones CRUD de saludos internacionales por país e idioma' },
      { name: 'Auth', description: 'Autenticación y gestión de sesiones del panel de administración' },
      { name: 'Health', description: 'Monitoreo del estado y disponibilidad del servicio' },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

module.exports = swaggerJsdoc(options);