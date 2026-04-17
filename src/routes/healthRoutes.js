const express = require('express');
const { healthCheck } = require('../controllers/healthController');

const router = express.Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verificación de estado del servicio
 *     description: >
 *       Endpoint público sin autenticación requerida. Útil para load balancers,
 *       orquestadores como Kubernetes y pipelines de CI/CD para verificar
 *       que el servicio se encuentra operativo.
 *     responses:
 *       200:
 *         description: El servicio está operativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 */
router.get('/', healthCheck);

module.exports = router;