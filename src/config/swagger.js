const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.API_TITLE || 'Hello World API',
      version: process.env.API_VERSION || '1.0.0',
      description:
        'API RESTful con endpoint protegido con JWT. Expone un endpoint GET /hola que requiere autenticación mediante Bearer Token para retornar un mensaje de saludo estructurado.',
      contact: {
        name: process.env.CONTACT_NAME || 'Equipo Técnico XP-9',
        email: process.env.CONTACT_EMAIL || 'dev@example.com',
        url: process.env.CONTACT_URL || 'https://github.com/example/hello-world-api',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo local',
      },
      {
        url: process.env.PRODUCTION_URL || 'https://api.example.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Hola',
        description: 'Endpoints del saludo. Agrupa las operaciones relacionadas con el recurso /hola.',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;