const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/user.repository');

const DUMMY_HASH = '$2b$12$KIXBp/dummy.hash.for.timing.attack.prevention.only.xxxxx';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not defined. Service cannot start without it.');
}

async function login(email, password) {
  const user = await UserRepository.findByEmail(email);

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const payload = {
    id: user.id,
    email: user.email,
    rol: user.rol,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    algorithm: 'HS256',
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      rol: user.rol,
    },
  };
}

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      const error = new Error('Token expirado');
      error.statusCode = 401;
      throw error;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      const error = new Error('Token inválido');
      error.statusCode = 401;
      throw error;
    }
    throw err;
  }
}

module.exports = {
  login,
  validateToken,
};