const winston = require('winston');

// ADVERTENCIA DE SEGURIDAD (DevSecOps):
// Está PROHIBIDO pasar como argumentos a este logger:
// - Passwords o credenciales
// - Tokens JWT o API keys
// - Datos de tarjetas de crédito/débito
// - PII (Información Personal Identificable): emails, DNI, teléfonos, etc.
// - Cualquier otro dato sensible o confidencial
// El logger es un canal de observabilidad, no de almacenamiento de datos privados.

// NOTA: El directorio logs/ debe existir en la raíz del proyecto antes de ejecutar
// la aplicación en entornos distintos a test. Debe ser creado por el script de
// inicialización del proyecto. Agregar logs/ al .gitignore del repositorio.

const { combine, timestamp, colorize, simple, printf, json, errors } = winston.format;

const NODE_ENV = process.env.NODE_ENV || 'production';
const SERVICE_NAME = process.env.SERVICE_NAME || 'api-service';

// Determinar el nivel de log en tiempo de inicialización del módulo
const resolveLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }
  if (NODE_ENV === 'development') {
    return 'debug';
  }
  return 'info';
};

const LOG_LEVEL = resolveLogLevel();

// Formato personalizado para desarrollo: legible, colorizado, con timestamp
const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? ` ${JSON.stringify(meta)}`
      : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} [${level}]: ${message}${metaStr}${stackStr}`;
  })
);

// Formato JSON estructurado para producción y otros entornos (ISO 8601)
const productionFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

// Seleccionar formato de consola según entorno
const consoleFormat = NODE_ENV === 'development' ? developmentFormat : productionFormat;

// Formato siempre JSON para archivos
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  json()
);

// Construir lista de transports
const transports = [];

// Console transport: siempre activo
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// File transports: solo cuando NO es entorno de test
if (NODE_ENV !== 'test') {
  // Transport para errores únicamente
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  );

  // Transport para todos los niveles (combined)
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    })
  );
}

// Crear instancia del logger de winston
const logger = winston.createLogger({
  // Niveles npm por defecto: error(0), warn(1), info(2), http(3), verbose(4), debug(5), silly(6)
  level: LOG_LEVEL,
  levels: winston.config.npm.levels,
  defaultMeta: {
    service: SERVICE_NAME,
  },
  transports,
  // No salir del proceso ante excepciones no manejadas desde el logger
  exitOnError: false,
});

// Propiedad stream para integración con morgan
// Morgan delegará sus access logs a winston a través de este stream,
// unificando toda la salida de logs en un único canal.
logger.stream = {
  write: (message) => {
    // Eliminar el salto de línea final que agrega morgan
    logger.http(message.trimEnd());
  },
};

module.exports = logger;