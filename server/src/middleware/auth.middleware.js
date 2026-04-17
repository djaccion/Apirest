const jwt = require('jsonwebtoken');

const TOKEN_PREFIX = 'Bearer';

if (!process.env.JWT_SECRET) {
  throw new Error('La variable de entorno JWT_SECRET es requerida para iniciar la aplicación de forma segura.');
}

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith(`${TOKEN_PREFIX} `)) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación.',
      code: 'TOKEN_MISSING',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== TOKEN_PREFIX) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación.',
      code: 'TOKEN_MISSING',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['RS256'] });
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'El token de autenticación ha expirado.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'El token de autenticación es inválido.',
        code: 'TOKEN_INVALID',
      });
    }

    console.error('Error inesperado en verificación de token:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      code: 'INTERNAL_ERROR',
    });
  }
};

const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No hay usuario autenticado.',
        code: 'TOKEN_MISSING',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'El usuario no tiene permisos suficientes para esta operación.',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return next();
  }

  if (!authHeader.startsWith(`${TOKEN_PREFIX} `)) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== TOKEN_PREFIX) {
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['RS256'] });
    req.user = decoded;
  } catch (error) {
    // Token inválido o expirado en modo opcional: no bloqueamos el request
  }

  next();
};

module.exports = {
  verifyToken,
  verifyRole,
  optionalAuth,
};