const { validationResult } = require('express-validator');
const { sign } = require('jsonwebtoken');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/response');

const generateToken = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 422, 'Errores de validación', errors.array());
  }

  const { username, password } = req.body;
  const requestId = req.requestId;

  const validUser = process.env.AUTH_TEST_USER;
  const validPassword = process.env.AUTH_TEST_PASSWORD;

  const usernameMatch = username === validUser;
  const passwordMatch = password === validPassword;

  await new Promise((resolve) => setTimeout(resolve, 50));

  if (!usernameMatch || !passwordMatch) {
    logger.warn('Intento de autenticación fallido', {
      username,
      requestId,
    });
    return errorResponse(res, 401, 'Credenciales inválidas');
  }

  try {
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    const payload = {
      sub: username,
      role: 'dev',
    };

    const token = sign(payload, process.env.JWT_SECRET, {
      expiresIn,
      algorithm: 'HS256',
    });

    logger.info('Token JWT generado exitosamente', {
      username,
      requestId,
    });

    return successResponse(res, 200, 'Token generado exitosamente', {
      token,
      expiresIn,
      tokenType: 'Bearer',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateToken };
module.exports.default = generateToken;