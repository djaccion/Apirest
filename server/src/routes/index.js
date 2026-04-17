const { Router } = require('express');
const greetingsRouter = require('./greetings');
const authRouter = require('./auth');
const adminRouter = require('./admin');
const healthRouter = require('./health');

/**
 * Router raíz de la API REST.
 * Centraliza y monta todos los sub-routers de la aplicación bajo sus prefijos correspondientes.
 * Todos los prefijos aquí definidos se montan bajo el prefijo base `/api`
 * que es configurado en el archivo principal de Express (server/src/app.js).
 *
 * Rutas completas resultantes:
 *   - /api/health
 *   - /api/auth
 *   - /api/greetings
 *   - /api/admin
 */

const router = Router();

router.use('/health', healthRouter);

router.use('/auth', authRouter);

router.use('/greetings', greetingsRouter);

router.use('/admin', adminRouter);

router.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint no encontrado',
    path: req.path,
  });
});

module.exports = router;