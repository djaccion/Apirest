const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');

const deepSanitizeStrings = (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[deepSanitizeStrings] Ejecutado en ${req.method} ${req.path}`);
    }

    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      }
      if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
      }
      if (value !== null && typeof value === 'object') {
        const sanitized = {};
        for (const key of Object.keys(value)) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      return value;
    };

    req.body = sanitizeValue(req.body);
    next();
  } catch (err) {
    console.error('[deepSanitizeStrings] Error durante sanitización:', err);
    next();
  }
};

const sanitizeQueryParams = (req, res, next) => {
  for (const key of Object.keys(req.query)) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key].trim().slice(0, 200);
    } else {
      req.query[key] = undefined;
    }
  }
  next();
};

const sanitizeMiddlewares = [
  mongoSanitize({ replaceWith: '_' }),
  xssClean(),
  deepSanitizeStrings,
  sanitizeQueryParams,
];

module.exports = { sanitizeMiddlewares, deepSanitizeStrings };