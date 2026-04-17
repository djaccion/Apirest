const User = require('../models/user.model');

/**
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
const findByUsername = async (username) => {
  return User.findOne({ username });
};

/**
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const findById = async (id) => {
  return User.findById(id).select('-passwordHash');
};

/**
 * @param {{ username: string, passwordHash: string, role: string }} userData
 * @returns {Promise<Object>}
 */
const create = async (userData) => {
  const user = new User(userData);
  return user.save();
};

/**
 * @returns {Promise<Array>}
 */
const findAll = async () => {
  return User.find({}).select('-passwordHash');
};

/**
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object|null>}
 */
const updateById = async (id, updateData) => {
  return User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select('-passwordHash');
};

/**
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
const deleteById = async (id) => {
  return User.findByIdAndDelete(id);
};

/**
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
const existsByUsername = async (username) => {
  return User.exists({ username });
};

module.exports = {
  findByUsername,
  findById,
  create,
  findAll,
  updateById,
  deleteById,
  existsByUsername,
};