const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const verifyToken = (req, res, next) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    logger.error({
      type: 'MISSING_JWT_SECRET',
      message: 'JWT_SECRET no está definido en las variables de entorno',
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({
      status: 'error',
      message: 'Configuración de seguridad incompleta',
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({
      type: 'MISSING_OR_INVALID_TOKEN_FORMAT',
      message: 'Header Authorization ausente o con formato inválido',
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return res.status(401).json({
      status: 'error',
      message: 'Token no proporcionado o formato inválido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn({
        type: 'TOKEN_EXPIRED',
        message: 'El token JWT ha expirado',
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({
        status: 'error',
        message: 'Token expirado',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn({
        type: 'INVALID_TOKEN',
        message: 'El token JWT es inválido',
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido',
      });
    }

    logger.error({
      type: 'UNEXPECTED_AUTH_ERROR',
      message: 'Error inesperado durante la autenticación',
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return res.status(500).json({
      status: 'error',
      message: 'Error interno de autenticación',
    });
  }
};

module.exports = { verifyToken };