const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const validateMiddleware = require('../middlewares/validate.middleware');
const { createDeploymentSchema } = require('../validators/deployment.validator');
const deploymentController = require('../controllers/deployments.controller');

const router = Router();

/**
 * @swagger
 * /api/v1/deployments:
 *   post:
 *     tags:
 *       - Deployments
 *     summary: Registrar un nuevo despliegue en el sistema
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeploymentCreate'
 *     responses:
 *       201:
 *         description: Despliegue registrado exitosamente
 *       400:
 *         description: Bad request
 *       401:
 *         description: No autenticado, token inválido o ausente
 *       403:
 *         description: No autorizado, se requiere rol admin
 *       422:
 *         description: Error de validación en el payload
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('admin'),
  validateMiddleware(createDeploymentSchema),
  deploymentController.createDeployment
);

module.exports = router;