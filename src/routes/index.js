const { Router } = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const holaRoutes = require('./hola.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/hola', holaRoutes);

module.exports = router;