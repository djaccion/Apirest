const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT firmado con los datos del usuario.
 * @param {Object} payload - Objeto con los datos del usuario.
 * @param {string|number} payload.id - ID del usuario.
 * @param {string} payload.email - Email del usuario.
 * @param {string} payload.role - Rol del usuario.
 * @returns {string} Token JWT firmado.
 * @throws {Error} Si JWT_SECRET no está definido.
 */
function generateToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  const cleanPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(cleanPayload, secret, {
    algorithm: 'HS256',
    expiresIn,
  });
}

/**
 * Verifica y decodifica un token JWT.
 * @param {string} token - Token JWT a verificar.
 * @returns {Object} Payload decodificado si el token es válido.
 * @throws {Error} Si el token es inválido, expirado o hay un error de verificación.
 */
function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
  }

  try {
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
}

/**
 * Decodifica un token JWT sin verificar la firma.
 * ⚠️ ADVERTENCIA: Esta función NO verifica la firma del token.
 * No debe usarse para autenticación ni para tomar decisiones de seguridad.
 * Usar únicamente para inspección cuando el token ya fue previamente validado.
 * @param {string} token - Token JWT a decodificar.
 * @returns {Object|null} Payload decodificado o null si el token es malformado.
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};