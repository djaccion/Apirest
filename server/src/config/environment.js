'use strict';

const dotenv = require('dotenv');

// Cargar variables de entorno desde .env antes de cualquier otra lógica
dotenv.config();

/**
 * Valida que las variables de entorno obligatorias estén definidas y no vacías.
 * Si alguna falta, lanza un Error explícito y detiene el arranque del servidor.
 * @param {string[]} requiredVars - Arreglo con los nombres de las variables obligatorias
 */
const validateRequiredEnvVars = (requiredVars) => {
  const missing = [];

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value === undefined || value === null || value.trim() === '') {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `[CONFIG ERROR] Las siguientes variables de entorno obligatorias están ausentes o vacías: ${missing.join(', ')}. ` +
      `El servidor no puede arrancar sin estas variables. Verifique su archivo .env o las variables de entorno del sistema.`
    );
  }
};

// Ejecutar validación de forma síncrona e inmediata al importar el módulo
// Si alguna variable falta, el proceso falla aquí antes de exportar nada
validateRequiredEnvVars([
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
]);

// Derivar valores booleanos de entorno una sola vez para reutilizar en el objeto
const nodeEnv = process.env.NODE_ENV;
const isProduction = nodeEnv === 'production';
const isDevelopment = nodeEnv === 'development';

// Determinar el origen permitido para CORS de forma segura
// En producción, FRONTEND_URL debe estar explícitamente definida; no se admite fallback inseguro
const resolveCorsAllowedOrigin = () => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl && frontendUrl.trim() !== '') {
    return frontendUrl.trim();
  }

  if (isProduction) {
    // En producción, la ausencia de FRONTEND_URL es un error de configuración crítico
    throw new Error(
      '[CONFIG ERROR] La variable de entorno FRONTEND_URL es obligatoria en el entorno de producción. ' +
      'Definir la URL del frontend en las variables de entorno del servidor (ej: Heroku Config Vars).'
    );
  }

  // Solo en desarrollo se permite el fallback a localhost
  console.warn(
    '[CONFIG WARN] FRONTEND_URL no está definida. ' +
    'Usando fallback de desarrollo: http://localhost:3000. ' +
    'Esto NO es aceptable en producción.'
  );
  return 'http://localhost:3000';
};

/**
 * Módulo centralizado de configuración de variables de entorno.
 * Es el único punto de acceso a process.env en toda la aplicación backend.
 * Ningún otro módulo debe leer directamente de process.env.
 *
 * El objeto está congelado en profundidad para prevenir mutaciones accidentales
 * en tiempo de ejecución.
 */
module.exports = Object.freeze({

  /**
   * Configuración del servidor Express
   */
  server: Object.freeze({
    // PORT: puerto en el que escucha el servidor (Heroku lo asigna dinámicamente)
    port: parseInt(process.env.PORT, 10) || 3000,

    // NODE_ENV: entorno de ejecución (development | staging | production)
    nodeEnv: nodeEnv,

    // Booleano derivado: true únicamente si NODE_ENV === 'production'
    isProduction: isProduction,

    // Booleano derivado: true únicamente si NODE_ENV === 'development'
    isDevelopment: isDevelopment,
  }),

  /**
   * Configuración de conexión a MongoDB Atlas
   */
  database: Object.freeze({
    // MONGODB_URI: cadena de conexión completa a MongoDB Atlas (validada como obligatoria)
    // Nunca debe contener credenciales hardcodeadas; proviene exclusivamente de variables de entorno
    uri: process.env.MONGODB_URI,

    // Opciones de conexión de Mongoose para optimizar el pool de conexiones
    options: Object.freeze({
      // useNewUrlParser: usar el nuevo parser de URL de MongoDB
      useNewUrlParser: true,

      // useUnifiedTopology: usar el nuevo motor de monitoreo de topología
      useUnifiedTopology: true,

      // DB_POOL_SIZE: tamaño máximo del pool de conexiones a MongoDB
      // Un pool adecuado mejora el rendimiento bajo carga concurrente
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    }),
  }),

  /**
   * Configuración de JSON Web Tokens para autenticación del panel de administración
   */
  jwt: Object.freeze({
    // JWT_SECRET: clave secreta para firmar access tokens (validada como obligatoria)
    // Debe ser una cadena aleatoria de alta entropía (mínimo 256 bits recomendado)
    secret: process.env.JWT_SECRET,

    // JWT_REFRESH_SECRET: clave secreta para firmar refresh tokens (validada como obligatoria)
    // Debe ser diferente a JWT_SECRET para aislar el compromiso de un tipo de token
    refreshSecret: process.env.JWT_REFRESH_SECRET,

    // JWT_EXPIRES_IN: tiempo de expiración del access token
    // Valor corto (1h) para minimizar la ventana de exposición ante robo de token
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',

    // JWT_REFRESH_EXPIRES_IN: tiempo de expiración del refresh token
    // Valor más largo (7d) para mantener la sesión sin requerir re-autenticación frecuente
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  }),

  /**
   * Configuración de CORS (Cross-Origin Resource Sharing)
   * Configurado restrictivamente para permitir solo el dominio del frontend autorizado
   */
  cors: Object.freeze({
    // FRONTEND_URL: único origen permitido para realizar peticiones al API
    // En producción es obligatorio; en desarrollo usa fallback a localhost
    allowedOrigin: resolveCorsAllowedOrigin(),

    // credentials: permitir el envío de cookies y headers de autorización en peticiones cross-origin
    // Necesario para el manejo de tokens de autenticación desde el frontend
    credentials: true,
  }),

  /**
   * Configuración de rate limiting para protección contra fuerza bruta y abuso de API
   */
  rateLimit: Object.freeze({
    // RATE_LIMIT_WINDOW_MS: ventana de tiempo en milisegundos para contar las peticiones
    // Por defecto 900000ms = 15 minutos, alineado con estándares de protección OWASP
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,

    // RATE_LIMIT_MAX: número máximo de peticiones permitidas por IP en la ventana definida
    // Por defecto 100 peticiones por ventana de 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  }),

  /**
   * Configuración de seguridad adicional para hashing y protección CSRF
   */
  security: Object.freeze({
    // BCRYPT_SALT_ROUNDS: factor de costo para el hash de contraseñas con bcryptjs
    // Valor 12 ofrece balance entre seguridad y rendimiento; aumentar en hardware más potente
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

    // CSRF_SECRET: secreto para la generación y validación de tokens CSRF en formularios de administración
    // Protege contra ataques Cross-Site Request Forgery en el panel de administración
    csrfSecret: process.env.CSRF_SECRET,
  }),
});