const logger = require('../utils/logger');
const { sendSuccess } = require('../utils/response');

const getHolaMundo = async (req, res, next) => {
  try {
    const requestId = req.requestId;

    const responseData = {
      message: 'Hola Mundo',
      timestamp: new Date().toISOString(),
      requestId,
    };

    logger.info('Endpoint GET /api/v1/hola invocado exitosamente', {
      requestId,
    });

    return sendSuccess(res, 200, responseData);
  } catch (error) {
    logger.error('Error inesperado en getHolaMundo', {
      requestId: req.requestId,
      message: error.message,
    });

    return next(error);
  }
};

module.exports = { getHolaMundo };