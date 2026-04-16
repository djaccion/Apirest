const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

class MetricsService {
  constructor(deploymentRepository, redisClient = null, eventPublisher = null) {
    this.deploymentRepository = deploymentRepository;
    this.redisClient = redisClient;
    this.eventPublisher = eventPublisher;
  }

  async getAverageDeploymentTime(id_app) {
    if (id_app === null || id_app === undefined || id_app === '') {
      throw new AppError('El parámetro id_app es requerido y no puede estar vacío', 400, 'INVALID_APP_ID');
    }

    const cacheKey = `metrics:avg-time:${id_app}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          logger.info(`[MetricsService] Cache hit para clave ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (redisError) {
        logger.error(`[MetricsService] Error al leer de Redis, continuando sin caché: ${redisError.message}`);
      }
    }

    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deployments = await this.deploymentRepository.findSuccessfulDeploymentsByAppAndDateRange(
      id_app,
      startDate,
      endDate
    );

    if (!deployments || deployments.length === 0) {
      const emptyResult = {
        appId: id_app,
        averageTime: 0,
        unit: 'seconds',
        totalDeployments: 0,
        periodDays: 7,
        calculatedAt: new Date().toISOString()
      };

      logger.info(`[MetricsService] No se encontraron despliegues exitosos para app ${id_app} en los últimos 7 días`);
      return emptyResult;
    }

    const totalDuration = deployments.reduce((acc, deployment) => {
      let durationSeconds;

      if (deployment.duration_seconds !== undefined && deployment.duration_seconds !== null) {
        durationSeconds = Number(deployment.duration_seconds);
      } else if (deployment.started_at && deployment.finished_at) {
        const startedAt = new Date(deployment.started_at).getTime();
        const finishedAt = new Date(deployment.finished_at).getTime();
        durationSeconds = (finishedAt - startedAt) / 1000;
      } else {
        durationSeconds = 0;
      }

      return acc + durationSeconds;
    }, 0);

    const averageTime = parseFloat((totalDuration / deployments.length).toFixed(2));

    const result = {
      appId: id_app,
      averageTime,
      unit: 'seconds',
      totalDeployments: deployments.length,
      periodDays: 7,
      calculatedAt: new Date().toISOString()
    };

    if (this.redisClient) {
      try {
        await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300);
        logger.info(`[MetricsService] Resultado almacenado en caché con clave ${cacheKey} y TTL 300s`);
      } catch (redisError) {
        logger.error(`[MetricsService] Error al escribir en Redis, continuando sin caché: ${redisError.message}`);
      }
    }

    if (this.eventPublisher && result.totalDeployments > 0) {
      const eventPayload = {
        event: 'METRICS_CALCULATED',
        appId: id_app,
        averageTime,
        totalDeployments: deployments.length,
        timestamp: new Date().toISOString()
      };

      this.eventPublisher.publish('metrics.calculated', eventPayload)
        .then(() => {
          logger.info(`[MetricsService] Evento METRICS_CALCULATED publicado para app ${id_app}`);
        })
        .catch((publishError) => {
          logger.error(`[MetricsService] Error al publicar evento en RabbitMQ: ${publishError.message}`);
        });
    }

    logger.info(`[MetricsService] Promedio calculado para app ${id_app}: ${averageTime}s sobre ${deployments.length} despliegues`);

    return result;
  }
}

module.exports = { MetricsService };