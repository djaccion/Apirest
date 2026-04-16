const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

async function hashPassword(plainPassword) {
  if (plainPassword === null || plainPassword === undefined || plainPassword === '') {
    throw new Error('Password is required and must be a non-empty string');
  }
  if (typeof plainPassword !== 'string') {
    throw new Error('Password must be a string');
  }
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

async function comparePassword(plainPassword, hashedPassword) {
  if (
    !plainPassword ||
    !hashedPassword ||
    typeof plainPassword !== 'string' ||
    typeof hashedPassword !== 'string'
  ) {
    throw new Error('Both plainPassword and hashedPassword are required');
  }
  const result = await bcrypt.compare(plainPassword, hashedPassword);
  return result;
}

module.exports = {
  hashPassword,
  comparePassword,
};