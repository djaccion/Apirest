const { Router } = require('express');
const holaController = require('../controllers/holaController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

const router = Router();

/**
 * @swagger
 * /api/hola:
 *   get:
 *     tags:
 *       - Hola
 *     summary: Saludo personalizado
 *     description: Retorna un mensaje de saludo. Requiere autenticación JWT válida. Acepta un parámetro opcional "nombre" para personalizar el saludo.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de autenticación Bearer. Formato: Bearer <token>
 *       - in: query
 *         name: nombre
 *         required: false
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Nombre opcional para personalizar el saludo
 *         example: Juan
 *     responses:
 *       200:
 *         description: Saludo generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Hola, Juan
 *       401:
 *         description: No autorizado. Token JWT ausente o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: No autorizado
 *       422:
 *         description: Error de validación en los parámetros de entrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Error de validación
 *                 errores:
 *                   type: array
 *                   items:
 *                     type: object
 *       429:
 *         description: Demasiadas peticiones. Límite de tasa excedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Demasiadas peticiones, intente más tarde
 */
router.get(
  '/hola',
  authMiddleware.verificarToken,
  validationMiddleware.validarHola,
  holaController.saludar
);

module.exports = router;