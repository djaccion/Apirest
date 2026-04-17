// JIRA: XP-9
const { Router } = require('express');
const jwtMiddleware = require('../middlewares/jwt.middleware');
const inputValidatorMiddleware = require('../middlewares/inputValidator.middleware');
const holaController = require('../controllers/hola.controller');

const router = Router();

/**
 * @swagger
 * /api/v1/hola:
 *   get:
 *     tags:
 *       - Saludo
 *     summary: Endpoint de saludo
 *     description: Retorna un mensaje de saludo junto con un timestamp. Requiere autenticación mediante JWT válido.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token de autenticación. Formato: Bearer <token>
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
 *                   example: Hola, mundo
 *                 timestamp:
 *                   type: string
 *                   example: '2024-01-01T00:00:00.000Z'
 *       401:
 *         description: Token ausente o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token inválido o no proporcionado
 *       429:
 *         description: Límite de solicitudes excedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Demasiadas solicitudes, intente más tarde
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno del servidor
 */
router.get('/hola', jwtMiddleware, inputValidatorMiddleware, holaController);

module.exports = router;