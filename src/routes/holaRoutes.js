const { Router } = require('express')
const { verifyToken } = require('../middlewares/authMiddleware')
const { getHola } = require('../controllers/holaController')

const router = Router()

/**
 * @openapi
 * /api/v1/hola:
 *   get:
 *     tags:
 *       - Hola
 *     summary: Retorna mensaje de saludo autenticado
 *     description: Endpoint protegido que requiere un JWT válido en el header Authorization. Retorna un mensaje "Hola Mundo" junto con el timestamp de la solicitud y un identificador único de request para trazabilidad.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Respuesta exitosa con mensaje de saludo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hola Mundo
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2024-01-15T10:30:00.000Z'
 *                 requestId:
 *                   type: string
 *                   example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
 *       401:
 *         description: Token JWT ausente o inválido
 *       429:
 *         description: Límite de solicitudes excedido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', verifyToken, getHola)

module.exports = router