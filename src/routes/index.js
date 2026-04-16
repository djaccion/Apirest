const { Router } = require('express');
const authRouter = require('./auth/auth.routes');
const userRouter = require('./users/user.routes');
const deploymentRouter = require('./deployments/deployment.routes');
const metricsRouter = require('./metrics/metrics.routes');
const syncRouter = require('./sync/sync.routes');

/**
 * Router agregador principal.
 * Este archivo centraliza y monta todos los sub-routers bajo sus prefijos de versión.
 * Los middlewares globales (helmet, cors, rate-limit, morgan) se configuran en app.js.
 */

const router = Router();

const API_PREFIX = '/api/v1';

router.use(`${API_PREFIX}/auth`, authRouter);
router.use(`${API_PREFIX}/users`, userRouter);
router.use(`${API_PREFIX}/deployments`, deploymentRouter);
router.use(`${API_PREFIX}/metrics`, metricsRouter);
router.use(`${API_PREFIX}/sync`, syncRouter);

router.get('/health', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

module.exports = router;