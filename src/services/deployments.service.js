const deploymentsRepository = require('../repositories/deployments.repository');
const rabbitmqClient = require('../events/rabbitmq.client');
const appsRepository = require('../repositories/apps.repository');
const AppError = require('../utils/AppError');

const VALID_STATUSES = ['SUCCESS', 'FAILED', 'IN_PROGRESS'];

class DeploymentsService {
  async registerDeployment(deploymentData) {
    const { id_app, version, status, deployed_by } = deploymentData;

    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status '${status}'. Allowed values are: ${VALID_STATUSES.join(', ')}`,
        'INVALID_STATUS',
        400
      );
    }

    const app = await appsRepository.findById(id_app);
    if (!app) {
      throw new AppError(
        `Application with id '${id_app}' not found`,
        'APP_NOT_FOUND',
        404
      );
    }

    const deploymentToCreate = {
      ...deploymentData,
      created_at: new Date().toISOString(),
    };

    const createdDeployment = await deploymentsRepository.create(deploymentToCreate);

    try {
      await rabbitmqClient.publish({
        eventType: 'DEPLOYMENT_REGISTERED',
        payload: createdDeployment,
        timestamp: new Date().toISOString(),
      });
    } catch (rabbitmqError) {
      console.error(
        '[DeploymentsService] Failed to publish DEPLOYMENT_REGISTERED event to RabbitMQ:',
        rabbitmqError.message
      );
    }

    return createdDeployment;
  }

  async getAverageDeploymentTime(id_app) {
    const parsedId = parseInt(id_app, 10);
    if (!id_app || isNaN(parsedId) || parsedId <= 0) {
      throw new AppError(
        `Invalid id_app '${id_app}'. Must be a positive integer.`,
        'INVALID_APP_ID',
        400
      );
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deployments = await deploymentsRepository.findSuccessfulByAppIdSince(
      parsedId,
      sevenDaysAgo
    );

    if (!deployments || deployments.length === 0) {
      return {
        id_app: parsedId,
        average_time_seconds: null,
        total_deployments: 0,
        period: 'last_7_days',
        message: 'No successful deployments found in the last 7 days',
      };
    }

    const totalSeconds = deployments.reduce((acc, deployment) => {
      const start = new Date(deployment.start_time).getTime();
      const end = new Date(deployment.end_time).getTime();
      const durationSeconds = (end - start) / 1000;
      return acc + durationSeconds;
    }, 0);

    const averageTimeSeconds = parseFloat(
      (totalSeconds / deployments.length).toFixed(2)
    );

    return {
      id_app: parsedId,
      average_time_seconds: averageTimeSeconds,
      total_deployments: deployments.length,
      period: 'last_7_days',
    };
  }
}

module.exports = new DeploymentsService();