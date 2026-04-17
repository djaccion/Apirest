const { Router } = require('express');
const authController = require('../controllers/authController');
const { validateAuthToken } = require('../middlewares/authValidators');

const router = Router();

/**
 * @swagger
 * /api/v1/auth/token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Genera un JWT para autenticación en el sistema
 *     description: Recibe credenciales de usuario y retorna un token JWT válido para acceder a los endpoints protegidos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario registrado en el sistema
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario (mínimo 6 caracteres)
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Token JWT generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT firmado para uso en endpoints protegidos
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn:
 *                   type: string
 *                   description: Tiempo de expiración del token
 *                   example: 1h
 *                 requestId:
 *                   type: string
 *                   description: Identificador único del request para trazabilidad
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *       400:
 *         description: Solicitud malformada o body ausente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bad Request
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Credenciales inválidas
 *       422:
 *         description: Error de validación de entrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error de validación
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: username
 *                       message:
 *                         type: string
 *                         example: El campo username es requerido
 */
router.post('/token', validateAuthToken, authController.generateToken);

module.exports = router;