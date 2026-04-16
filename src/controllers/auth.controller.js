const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
  const { email, password } = req.body;

  logger.info({ msg: 'Login attempt', email });

  try {
    const result = await authService.authenticate(email, password);

    logger.info({ msg: 'Login successful', email, userId: result.user.id });

    return res.status(200).json({
      token: result.token,
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    if (
      error.code === 'INVALID_CREDENTIALS' ||
      error.type === 'AuthenticationError'
    ) {
      logger.warn({ msg: 'Failed login attempt', email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: 'Bad request' });
    }

    logger.error({ msg: 'Unexpected error during login', error });
    return next(error);
  }
};

module.exports = { login };