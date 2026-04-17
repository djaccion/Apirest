const logger = require('../config/logger');

const MSG_SALUDO_GENERICO = 'Hola, mundo!';
const MSG_SALUDO_PERSONALIZADO = (nombre) => `Hola, ${nombre}!`;
const LOG_ENDPOINT_INVOCADO = 'Endpoint /hola invocado';

function getHola(req, res, next) {
  try {
    const { nombre } = req.query;

    const mensaje = nombre
      ? MSG_SALUDO_PERSONALIZADO(nombre)
      : MSG_SALUDO_GENERICO;

    logger.info(LOG_ENDPOINT_INVOCADO, {
      nombre: nombre || null,
      ip: req.ip,
    });

    return res.status(200).json({
      mensaje,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHola };