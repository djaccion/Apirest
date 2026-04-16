const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const createUserValidator = require('../middlewares/validators/createUser.validator');
const updateUserValidator = require('../middlewares/validators/updateUser.validator');
const { managementLimiter } = require('../middlewares/rateLimiter.middleware');
const { createUser, getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/users.controller');

const router = Router();

router.use(managementLimiter);
router.use(authMiddleware);
router.use(rbacMiddleware('admin'));

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Crear un nuevo usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserPayload'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Payload inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.post('/', createUserValidator, createUser);

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 */
router.get('/', getAllUsers);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtener un usuario por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador único del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', getUserById);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Actualizar un usuario por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador único del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserPayload'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       400:
 *         description: Payload inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', updateUserValidator, updateUser);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Eliminar un usuario por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Identificador único del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', deleteUser);

module.exports = router;