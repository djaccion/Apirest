const jwt = require('jsonwebtoken');

// ADVERTENCIA: JWT_SECRET debe estar definido en el archivo .env y NUNCA hardcodeado en el código fuente.

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer del header Authorization y adjunta el payload a req.user.
 *
 * TODO: En la iteración con MongoDB, agregar verificación de token en lista negra (blacklist)
 * para soporte de logout antes de llamar a next().
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  // Paso 1 - Extracción del header
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación.',
    });
  }

  // Paso 2 - Validación del esquema Bearer
  const parts = authorizationHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Se esperaba: Bearer <token>',
    });
  }

  // Paso 3 - Extracción del token
  const rawToken = parts[1];

  // Paso 4 - Verificación criptográfica
  try {
    // En producción se debe especificar algorithms: ['HS256'] explícitamente para evitar ataques de confusión de algoritmo.
    const decodedPayload = jwt.verify(rawToken, process.env.JWT_SECRET);

    // Paso 5 - Adjuntar payload al request (solo lectura para controladores downstream)
    req.user = decodedPayload;

    // Paso 6 - Llamada a next() solo tras verificación exitosa
    next();
  } catch (error) {
    // Paso 7 - Manejo de errores de jsonwebtoken

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'El token ha expirado.',
        expiredAt: error.expiredAt,
      });
    }

    if (error.name === 'JsonWebTokenError') {
      // Nunca revelar si el secreto es incorrecto versus token malformado;
      // ambos casos responden con el mismo mensaje genérico para no dar información al atacante.
      return res.status(401).json({
        success: false,
        message: 'Token inválido.',
      });
    }

    // Error inesperado (ej: JWT_SECRET no definido u otro error interno)
    // En iteraciones futuras reemplazar console.error por el logger de winston.
    // NUNCA loguear el token JWT completo.
    console.error('[authMiddleware] Error inesperado durante la verificación del token:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante la autenticación.',
    });
  }
}

module.exports = authMiddleware;