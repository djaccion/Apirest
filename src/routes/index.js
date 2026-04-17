const express = require('express');
const healthRouter = require('./health.routes');
const authRouter = require('./auth.routes');
// Future imports:
// const usersRouter = require('./users.routes');
// const logsRouter = require('./logs.routes');

/**
 * @file src/routes/index.js
 * @description Router aggregator. Centralizes and mounts all API sub-routers
 *              under their corresponding route prefixes within the /api/v1 namespace.
 *              This file contains no business logic, middleware, or direct endpoint definitions.
 * @team       Backend Team
 * @created    2025-01-01
 */

const router = express.Router();

// Health check domain – publicly accessible, used by monitoring systems and container probes
router.use('/health', healthRouter);

// Authentication domain – exposes login and token refresh endpoints
router.use('/auth', authRouter);

// Future mounts:
// Users domain – user management endpoints (CRUD, roles, etc.)
// router.use('/users', usersRouter);

// Logs domain – access log querying and audit trail endpoints
// router.use('/logs', logsRouter);

module.exports = router;