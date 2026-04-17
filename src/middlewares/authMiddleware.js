const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  const requestId = req.requestId || null;

  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET environment variable is not configured', { requestId });
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor: configuración de autenticación no disponible',
      requestId,
    });
  }

  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Authentication failed: missing or malformed Authorization header', {
      requestId,
      ip: req.ip,
    });
    return res.status(401).json({
      success: false,
      message: 'Token no proporcionado o formato incorrecto. Se requiere Authorization: Bearer <token>',
      requestId,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    logger.debug('Authentication successful', {
      requestId,
      userId: decoded.id || decoded.sub || null,
    });

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: token expired', {
        requestId,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'El token ha expirado. Por favor, obtenga un nuevo token',
        requestId,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: invalid token', {
        requestId,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        requestId,
      });
    }

    logger.warn('Authentication failed: unexpected error during token verification', {
      requestId,
      ip: req.ip,
      errorName: error.name,
    });
    return res.status(500).json({
      success: false,
      message: 'Error interno al verificar el token',
      requestId,
    });
  }
};

module.exports = { verifyToken };