'use strict';

/**
 * @file src/utils/logger.js
 * @description Centraliza la configuración del sistema de logging estructurado.
 *              Combina winston para logs de aplicación en formato JSON y morgan
 *              como middleware HTTP logger, integrados bajo una única utilidad exportable.
 * @module utils/logger
 * @ticket Jira XP-9
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const morgan = require('morgan');

// ---------------------------------------------------------------------------
// SEGURIDAD: Los archivos de log NUNCA deben contener valores de headers
// Authorization, passwords ni secrets. Es responsabilidad de cada capa
// sanitizar los datos antes de invocar cualquier método de este logger.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Configuración de rutas de archivos de log (configurables por entorno)
// ---------------------------------------------------------------------------
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_ERROR_FILE = process.env.LOG_ERROR_FILE || path.join(LOG_DIR, 'error.log');
const LOG_COMBINED_FILE = process.env.LOG_COMBINED_FILE || path.join(LOG_DIR, 'combined.log');
const LOG_EXCEPTIONS_FILE = process.env.LOG_EXCEPTIONS_FILE || path.join(LOG_DIR, 'exceptions.log');

// Garantizar que el directorio logs/ exista antes de inicializar transports de archivo
fs.mkdirSync(LOG_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Nivel de log dinámico
// ---------------------------------------------------------------------------
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const resolveLogLevel = () => {
  if (isProduction) {
    return 'warn';
  }
  return process.env.LOG_LEVEL || 'info';
};

// ---------------------------------------------------------------------------
// Formato base compartido (JSON estructurado compatible con SIEM/ELK/Datadog)
// ---------------------------------------------------------------------------
const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.sssZ' }),
  format.errors({ stack: true }),
  format.json()
);

// Formato para consola en entornos no productivos (legibilidad en desarrollo)
const devConsoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.sssZ' }),
  format.errors({ stack: true }),
  format.colorize(),
  format.simple()
);

// ---------------------------------------------------------------------------
// Transport: Consola
// ---------------------------------------------------------------------------
const consoleTransport = new transports.Console({
  format: isProduction ? baseFormat : devConsoleFormat,
  handleExceptions: true,
  handleRejections: true,
});

// ---------------------------------------------------------------------------
// Transport: Archivo de errores
// ---------------------------------------------------------------------------
const errorFileTransport = new transports.File({
  filename: LOG_ERROR_FILE,
  level: 'error',
  format: baseFormat,
});

// ---------------------------------------------------------------------------
// Transport: Archivo combinado
// ---------------------------------------------------------------------------
const combinedFileTransport = new transports.File({
  filename: LOG_COMBINED_FILE,
  format: baseFormat,
});

// ---------------------------------------------------------------------------
// Transport: Excepciones no manejadas
// ---------------------------------------------------------------------------
const exceptionsFileTransport = new transports.File({
  filename: LOG_EXCEPTIONS_FILE,
  format: baseFormat,
});

// ---------------------------------------------------------------------------
// Instancia principal de Winston
// ---------------------------------------------------------------------------
const logger = createLogger({
  level: resolveLogLevel(),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'api-service',
  },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  exceptionHandlers: [
    consoleTransport,
    exceptionsFileTransport,
  ],
  rejectionHandlers: [
    consoleTransport,
    exceptionsFileTransport,
  ],
  exitOnError: false,
});

// ---------------------------------------------------------------------------
// Stream para integración Morgan → Winston
// ---------------------------------------------------------------------------
const winstonStream = {
  /**
   * Escribe un mensaje HTTP al nivel http del logger de winston.
   * @param {string} message - Línea de log generada por morgan.
   */
  write(message) {
    logger.http(message.trim());
  },
};

// ---------------------------------------------------------------------------
// Formato morgan según entorno
// ---------------------------------------------------------------------------
const morganFormat = isProduction ? 'combined' : 'dev';

// ---------------------------------------------------------------------------
// Middleware morgan integrado con el stream de winston
// ---------------------------------------------------------------------------
const morganMiddleware = morgan(morganFormat, { stream: winstonStream });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LoggerModule
 * @property {import('winston').Logger} logger       - Instancia de winston configurada para uso
 *                                                     directo en controladores, middlewares y
 *                                                     cualquier capa de la aplicación.
 * @property {Function}                morganMiddleware - Middleware morgan integrado con el stream
 *                                                        de winston, listo para ser montado en Express.
 */

/**
 * Módulo de logging centralizado.
 *
 * @type {LoggerModule}
 *
 * @example
 * // En app.js o server.js
 * const { logger, morganMiddleware } = require('./utils/logger');
 * app.use(morganMiddleware);
 * logger.info('Servidor iniciado', { port: 3000 });
 */
module.exports = {
  logger,
  morganMiddleware,
};