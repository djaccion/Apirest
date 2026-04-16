const { Router } = require('express');
const metricsController = require('../controllers/metrics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');
const validateMiddleware = require('../middlewares/validate.middleware');

const router = Router({ mergeParams: true });

router.get(
  '/:id_app',
  authMiddleware,
  rbacMiddleware('admin'),
  validateMiddleware({
    params: {
      id_app: {
        required: true,
        type: 'integer',
        positive: true,
      },
    },
  }),
  metricsController.getAverageDeploymentTime
);

module.exports = router;