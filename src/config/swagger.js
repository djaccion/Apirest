const path = require('path');

/**
 * @fileoverview Configuración centralizada de Swagger/OpenAPI para la API RESTful Segura.
 *
 * Propósito: Proveer el objeto de opciones que consume swagger-jsdoc para construir
 * la especificación OpenAPI 3.0 de forma automática a partir de comentarios JSDoc
 * en rutas y controladores.
 *
 * Dependencias esperadas en el entorno:
 *   - PORT: puerto en el que corre el servidor (ej: 3000)
 *   - NODE_ENV: ambiente activo (development | staging | production)
 *   - API_VERSION: versión semántica de la API (ej: 1.0.0)
 *
 * Nota: dotenv debe estar cargado en el entry point antes de importar este archivo.
 * Este archivo es completamente stateless y no produce efectos secundarios al ser importado.
 *
 * Referencia backlog: Jira XP-9
 */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'API RESTful Segura - Node.js',
      // API_VERSION proviene de process.env; fallback explícito a '1.0.0' si no está definida
      version: process.env.API_VERSION || '1.0.0',
      description:
        'API RESTful construida sobre Node.js 20 LTS con Express.js 4.x. ' +
        'Incluye autenticación JWT mediante Bearer Token, rate limiting por IP para ' +
        'protección contra DoS/DDoS, validación y sanitización de entrada con ' +
        'express-validator, cabeceras de seguridad HTTP con Helmet, y documentación ' +
        'interactiva generada automáticamente con Swagger UI.',
      contact: {
        // Placeholder: el equipo debe actualizar estos valores según el proyecto
        name: 'Equipo de Desarrollo',
        email: 'dev-team@example.com',
        url: 'https://github.com/your-org/your-repo',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },

    servers: [
      {
        // URL dinámica construida con PORT; fallback a 3000 si PORT no está definida
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        // NODE_ENV incluido en la descripción para identificar el ambiente activo
        description: `Servidor local - Ambiente: ${process.env.NODE_ENV || 'development'}`,
      },
      {
        // Placeholder para producción: el equipo debe completar la URL real antes del despliegue
        url: 'https://api.your-domain.com/api/v1',
        description: 'Servidor de producción (completar URL antes del despliegue)',
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Token JWT obtenido en el endpoint de autenticación. ' +
            'Formato: Authorization: Bearer <token>',
        },
      },

      schemas: {
        // Schema base de Error reutilizable mediante $ref: "#/components/schemas/Error"
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje descriptivo del error',
              example: 'Recurso no encontrado',
            },
            statusCode: {
              type: 'integer',
              description: 'Código de estado HTTP asociado al error',
              example: 404,
            },
          },
          required: ['message', 'statusCode'],
        },
      },
    },

    // Seguridad global: todos los endpoints heredan BearerAuth salvo sobreescritura explícita
    security: [
      {
        BearerAuth: [],
      },
    ],

    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación: login, registro y gestión de tokens JWT',
      },
      {
        name: 'Health',
        description: 'Endpoint de health check para monitoreo y verificación del estado del servicio',
      },
      {
        name: 'Users',
        description: 'Placeholder para futura gestión de usuarios (CRUD, roles, permisos)',
      },
    ],
  },

  // Patrones glob para que swagger-jsdoc escanee comentarios JSDoc en rutas y controladores
  // Se usan rutas absolutas con path.join y __dirname para compatibilidad multiplataforma
  apis: [
    path.join(__dirname, '..', 'routes', '*.js'),
    path.join(__dirname, '..', 'controllers', '*.js'),
  ],
};

module.exports = swaggerOptions;