const userService = require('../services/users.service');

const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    const newUser = await userService.createUser({ username, email, password, role });

    const { password: _pwd, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    if (error.type === 'CONFLICT' || error.code === 'CONFLICT') {
      return res.status(409).json({
        success: false,
        message: error.message || 'El email ya está registrado.',
        code: 'CONFLICT',
      });
    }
    return next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await userService.listUsers({ page, limit });

    const usersWithoutPassword = result.users.map(({ password: _pwd, ...user }) => user);

    return res.status(200).json({
      success: true,
      data: usersWithoutPassword,
      meta: {
        total: result.total,
        page,
        limit,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro id debe ser un entero positivo válido.',
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Usuario con id ${id} no encontrado.`,
        code: 'NOT_FOUND',
      });
    }

    const { password: _pwd, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    if (error.type === 'NOT_FOUND' || error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Usuario no encontrado.',
        code: 'NOT_FOUND',
      });
    }
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro id debe ser un entero positivo válido.',
        code: 'VALIDATION_ERROR',
      });
    }

    const { id: _id, password: _pwd, ...allowedFields } = req.body;

    const updatedUser = await userService.updateUser(id, allowedFields);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: `Usuario con id ${id} no encontrado.`,
        code: 'NOT_FOUND',
      });
    }

    const { password: _password, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    if (error.type === 'NOT_FOUND' || error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Usuario no encontrado.',
        code: 'NOT_FOUND',
      });
    }
    if (error.type === 'VALIDATION_ERROR' || error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error de validación.',
        code: 'VALIDATION_ERROR',
      });
    }
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro id debe ser un entero positivo válido.',
        code: 'VALIDATION_ERROR',
      });
    }

    const deleted = await userService.deleteUser(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Usuario con id ${id} no encontrado.`,
        code: 'NOT_FOUND',
      });
    }

    return res.status(204).send();
  } catch (error) {
    if (error.type === 'NOT_FOUND' || error.code === 'NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Usuario no encontrado.',
        code: 'NOT_FOUND',
      });
    }
    return next(error);
  }
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};