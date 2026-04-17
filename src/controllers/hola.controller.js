const logger = require('../utils/logger');

const holaController = async (req, res, next) => {
  try {
    const username = (req.user && (req.user.username || req.user.sub)) || 'usuario';

    logger.info(`Solicitud recibida en holaController para el usuario: ${username}`);

    const responseBody = {
      message: `Hola, ${username}`,
      timestamp: new Date().toISOString(),
      status: 'success',
    };

    logger.info(`Respuesta exitosa enviada con status 200 para el usuario: ${username}`);

    res.status(200).json(responseBody);
  } catch (error) {
    next(error);
  }
};

module.exports = { holaController };