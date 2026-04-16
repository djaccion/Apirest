/**
 * @module rbac.middleware
 * @description Middleware de autorización basado en roles (RBAC).
 * Se ejecuta después del middleware de autenticación JWT y verifica
 * que el usuario autenticado posee el rol requerido para acceder al recurso.
 */

/**
 * Función de orden superior que genera un middleware Express de autorización RBAC.
 *
 * @param {...string} roles - Uno o más roles permitidos para acceder al recurso.
 * @returns {Function} Middleware Express con firma (req, res, next).
 * @example
 * router.get('/users', authenticateJWT, authorizeRoles('admin'), userController.list);
 */
const authorizeRoles = (...roles) => {
  // Validación en tiempo de configuración: se debe especificar al menos un rol
  if (!roles || roles.length === 0) {
    throw new Error('authorizeRoles: Se debe especificar al menos un rol permitido.');
  }

  return (req, res, next) => {
    try {
      // Paso 1 - Verificar existencia de usuario autenticado
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'No hay sesión autenticada. Acceso denegado.'
        });
      }

      // Paso 2 - Verificar existencia del campo rol en el usuario autenticado
      if (!req.user.role) {
        return res.status(403).json({
          status: 'error',
          message: 'El usuario no tiene rol asignado. Acceso denegado.'
        });
      }

      // Paso 3 - Verificar si el rol del usuario está en la lista de roles permitidos
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'error',
          message: 'Acceso denegado por rol insuficiente.',
          required: roles,
          current: req.user.role
        });
      }

      // Paso 4 - Autorización exitosa, continuar al siguiente middleware o controlador
      next();
    } catch (error) {
      // Delegar cualquier error inesperado al manejador de errores global de Express
      next(error);
    }
  };
};

module.exports = { authorizeRoles };