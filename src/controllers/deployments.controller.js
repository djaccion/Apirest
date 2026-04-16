const deploymentService = require('../services/deployments.service');

const MESSAGES = {
  DEPLOYMENT_CREATED: 'Deployment registered successfully',
  UNEXPECTED_NULL: 'DeploymentService returned an unexpected null or empty result',
};

const deploymentsController = {
  /**
   * Creates a new deployment record.
   * @route POST /api/v1/deployments
   * @auth Requires JWT authentication and admin role
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async createDeployment(req, res, next) {
    try {
      const { id_app, version, status, environment, deployed_by } = req.body;

      const createdDeployment = await deploymentService.createDeployment({
        id_app,
        version,
        status,
        environment,
        deployed_by,
      });

      if (!createdDeployment) {
        const error = new Error(MESSAGES.UNEXPECTED_NULL);
        return next(error);
      }

      return res.status(201).json({
        success: true,
        message: MESSAGES.DEPLOYMENT_CREATED,
        data: createdDeployment,
      });
    } catch (error) {
      return next(error);
    }
  },

  // TODO: Implement getDeploymentsByApp in the next sprint
  // async getDeploymentsByApp(req, res, next) { ... }
};

module.exports = deploymentsController;