'use strict';

/**
 * @fileoverview Utilidad para generación y gestión de identificadores únicos por request HTTP.
 * Garantiza trazabilidad end-to-end en logs y respuestas sin dependencias externas.
 */

/**
 * Genera un identificador único para un request HTTP.
 * Combina un prefijo fijo, timestamp en milisegundos y una cadena aleatoria hexadecimal.
 * La función es determinista en estructura pero no en valor: siempre produce el mismo
 * formato pero nunca el mismo ID dos veces en condiciones normales.
 *
 * @function generateRequestId
 * @returns {string} ID único con formato `req-{timestamp}-{hexRandom}`, ejemplo: `req-1718200000000-a3f9c21b`
 */
function generateRequestId() {
  const prefix = 'req';
  const timestamp = Date.now();
  const randomHex = Math.random().toString(16).slice(2);
  return `${prefix}-${timestamp}-${randomHex}`;
}

/**
 * Asigna un identificador único al objeto request de Express.
 * Si el header entrante `x-request-id` ya contiene un valor (asignado por un API Gateway
 * o cliente upstream), ese valor es reutilizado para mantener la trazabilidad distribuida.
 * En caso contrario, genera un nuevo ID mediante `generateRequestId`.
 * El ID resultante queda disponible en `req.id` para uso posterior en middlewares y controladores.
 *
 * @function attachRequestId
 * @param {import('express').Request} req - Objeto request de Express al que se le asignará el ID.
 * @returns {string} El ID asignado al request, ya sea el proveniente del header o el recién generado.
 */
function attachRequestId(req) {
  const incomingId = req.headers && req.headers['x-request-id'];
  const requestId = (incomingId && incomingId.trim() !== '') ? incomingId.trim() : generateRequestId();
  req.id = requestId;
  return requestId;
}

/**
 * Obtiene el identificador único previamente asignado a un objeto request de Express.
 * Actúa como accessor seguro: si `req.id` no está definido por alguna razón,
 * retorna el string literal `'unknown'` como fallback, garantizando que nunca
 * se retorne `undefined` ni `null`.
 *
 * @function getRequestId
 * @param {import('express').Request} req - Objeto request de Express del que se leerá el ID.
 * @returns {string} El ID del request si existe, o `'unknown'` como fallback seguro.
 */
function getRequestId(req) {
  return (req && req.id) ? req.id : 'unknown';
}

module.exports = {
  generateRequestId,
  attachRequestId,
  getRequestId,
};