const authService = require('../services/auth.service');

const COOKIE_NAME = 'refreshToken';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: SEVEN_DAYS_MS,
});

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const { accessToken, refreshToken, user } = await authService.login(username, password);

    res.cookie(COOKIE_NAME, refreshToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        user,
      },
      message: 'Sesión iniciada exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const existingToken = req.cookies[COOKIE_NAME];

    if (existingToken) {
      if (typeof authService.invalidateRefreshToken === 'function') {
        await authService.invalidateRefreshToken(existingToken);
      }
    }

    res.cookie(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'No autorizado',
    });
  }

  try {
    const result = await authService.refreshToken(token);

    if (result.refreshToken) {
      res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());
    }

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
      message: 'Token renovado exitosamente',
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = login;
exports.logout = logout;
exports.refreshToken = refreshToken;