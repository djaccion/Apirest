const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const BCRYPT_SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

function generateAccessToken(payload) {
  const { userId, username, role } = payload;
  return jwt.sign({ userId, username, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

async function loginUser(username, password) {
  const GENERIC_ERROR_MESSAGE = 'Credenciales inválidas';

  const user = await userRepository.findByUsername(username);

  if (!user) {
    await bcrypt.compare(password, '$2b$12$invalidhashfortimingattackprevention00000000000000000');
    throw new AuthenticationError(GENERIC_ERROR_MESSAGE);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError(GENERIC_ERROR_MESSAGE);
  }

  if (!user.isActive) {
    throw new AuthenticationError('La cuenta está deshabilitada');
  }

  const tokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      throw new AuthenticationError('Token de acceso inválido o expirado');
    }
    throw error;
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      throw new AuthenticationError('Refresh token inválido o expirado');
    }
    throw error;
  }
}

async function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);

  const user = await userRepository.findById(decoded.userId);

  if (!user) {
    throw new AuthenticationError('Usuario no encontrado');
  }

  if (!user.isActive) {
    throw new AuthenticationError('La cuenta está deshabilitada');
  }

  const tokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);

  return {
    accessToken: newAccessToken,
  };
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AuthenticationError('Usuario no encontrado');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('La contraseña actual es incorrecta');
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);

  if (isSamePassword) {
    throw new AuthenticationError('La nueva contraseña no puede ser igual a la contraseña actual');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await userRepository.updatePasswordHash(userId, newPasswordHash);

  return {
    success: true,
    message: 'Contraseña actualizada correctamente',
  };
}

module.exports = {
  loginUser,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  hashPassword,
  changePassword,
  AuthenticationError,
  AuthorizationError,
};