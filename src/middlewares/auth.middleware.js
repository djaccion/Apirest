const jwt = require('jsonwebtoken');
const process = require('process');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación o el formato es inválido. Use: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación o el formato es inválido. Use: Bearer <token>',
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Error de configuración del servidor. Contacte al administrador.',
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token de autenticación ha expirado. Por favor, inicie sesión nuevamente.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'El token de autenticación es inválido.',
    });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida. Por favor, inicie sesión.',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos suficientes para acceder a este recurso.',
      });
    }

    return next();
  };
};

module.exports = { verifyToken, requireRole };