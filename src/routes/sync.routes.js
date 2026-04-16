const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { rbac } = require('../middlewares/rbac.middleware');
const { validateSyncUsers } = require('../middlewares/validators/sync.validator');
const { syncUsers } = require('../controllers/sync.controller');

const syncRateLimiter = rateLimit({
  windowMs: parseInt(process.env.SYNC_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.SYNC_RATE_LIMIT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /api/v1/sync/users:
 *   post:
 *     tags:
 *       - Sync
 *     summary: Sincronización de usuarios con servicios externos
 *     description: Sincronización de usuarios con servicios externos. Operación restringida a administradores.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SyncUsersRequest'
 *     responses:
 *       200:
 *         description: Sincronización completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SyncUsersResponse'
 *       400:
 *         description: Payload malformado
 *       401:
 *         description: Token ausente o inválido
 *       403:
 *         description: Rol insuficiente
 *       422:
 *         description: Error de validación con detalle de campos
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/users', syncRateLimiter, authenticateToken, rbac('admin'), validateSyncUsers, syncUsers);

module.exports = router;