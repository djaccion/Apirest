'use strict';

const jwt = require('jsonwebtoken');

/**
 * @constant {string} ALGORITHM
 * @description Algoritmo de firma hardcodeado para prevenir ataques de confusión de algoritmo.
 * No debe ser configurable externamente.
 */
const ALGORITHM = 'HS256';

/**
 * Validación fail-fast de JWT_SECRET.
 * Si la variable de entorno no está definida, el módulo falla inmediatamente al ser cargado.
 * Nunca se loguea el valor del secret.
 */
if (!process.env.JWT_SECRET) {
  throw new Error(
    '[jwtHelper] La variable de entorno JWT_SECRET es obligatoria y no está definida. ' +
      'El servicio no puede iniciarse sin una clave secreta para JWT.'
  );
}

/**
 * @constant {string} JWT_SECRET
 * @description Clave secreta para firmar y verificar tokens JWT.
 */
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @constant {string} JWT_EXPIRES_IN
 * @description Tiempo de expiración del token. Por defecto: 1h.
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * @constant {string} JWT_ISSUER
 * @description Identificador del emisor del token (claim iss). Por defecto: api-service.
 */
const JWT_ISSUER = process.env.JWT_ISSUER || 'api-service';

/**
 * @constant {string} JWT_AUDIENCE
 * @description Audiencia esperada del token (claim aud). Por defecto: api-client.
 */
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'api-client';

/**
 * Genera un JSON Web Token firmado con los datos del payload proporcionado.
 *
 * @function generateToken
 * @param {Object} payload - Datos del usuario o entidad a incluir en el token.
 *   Debe ser un objeto no nulo y no vacío. Ejemplo: { id, email, role }.
 * @returns {string} Token JWT firmado como string.
 * @throws {Error} Si el payload no es un objeto válido o no nulo.
 * @throws {Error} Si jsonwebtoken falla internamente al firmar el token.
 */
function generateToken(payload) {
  if (
    payload === null ||
    payload === undefined ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).length === 0
  ) {
    throw new Error(
      '[jwtHelper] generateToken: El payload debe ser un objeto no nulo y no vacío.'
    );
  }

  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: ALGORITHM,
    });

    return token;
  } catch (error) {
    throw new Error(
      `[jwtHelper] generateToken: Error al firmar el token JWT. Detalle interno: ${error.message}`
    );
  }
}

/**
 * Verifica la validez de un JSON Web Token.
 * Comprueba la firma, la expiración, el emisor y la audiencia.
 * Previene ataques de confusión de algoritmo restringiendo los algoritmos aceptados.
 *
 * @function verifyToken
 * @param {string} token - Token JWT a verificar.
 * @returns {Object} Payload decodificado si el token es válido.
 * @throws {Error} Si el token no es un string no vacío.
 * @throws {Error} Si el token ha expirado (TokenExpiredError).
 * @throws {Error} Si el token tiene firma o estructura inválida (JsonWebTokenError).
 * @throws {Error} Si el token aún no es válido según el claim nbf (NotBeforeError).
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error(
      '[jwtHelper] verifyToken: El token debe ser un string no vacío.'
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [ALGORITHM],
    });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error(
        '[jwtHelper] verifyToken: El token ha expirado. Por favor, autentíquese nuevamente.'
      );
    }

    if (error instanceof jwt.NotBeforeError) {
      throw new Error(
        '[jwtHelper] verifyToken: El token aún no es válido. No ha alcanzado su tiempo de activación (nbf).'
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(
        '[jwtHelper] verifyToken: El token es inválido. La firma o la estructura del token son incorrectas.'
      );
    }

    throw new Error(
      `[jwtHelper] verifyToken: Error inesperado al verificar el token. Detalle interno: ${error.message}`
    );
  }
}

/**
 * Decodifica un JSON Web Token sin verificar su firma.
 *
 * @WARNING Esta función NO verifica la autenticidad ni la integridad del token.
 * Debe usarse ÚNICAMENTE para inspección o lectura de claims en contextos donde
 * la verificación ya fue realizada previamente. NUNCA usar para autenticación.
 *
 * @function decodeToken
 * @param {string} token - Token JWT a decodificar.
 * @returns {{ header: Object, payload: Object, signature: string }} Objeto con las
 *   tres partes del token: header, payload y signature.
 * @throws {Error} Si el token no es un string no vacío.
 * @throws {Error} Si el token está malformado y no puede ser decodificado.
 */
function decodeToken(token) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error(
      '[jwtHelper] decodeToken: El token debe ser un string no vacío.'
    );
  }

  const decoded = jwt.decode(token, { complete: true });

  if (decoded === null) {
    throw new Error(
      '[jwtHelper] decodeToken: El token está malformado y no pudo ser decodificado. ' +
        'Verifique que el token tenga el formato JWT válido (header.payload.signature).'
    );
  }

  return decoded;
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};