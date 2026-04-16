const metricsService = require('../services/metrics.service');
const logger = require('../utils/logger');

/**
 * @description Controller for metrics domain. Handles HTTP request/response cycle
 * and delegates business logic to the metrics service layer.
 */

/**
 * @function getAverageDeploymentTime
 * @description Retrieves the average deployment time for successful deployments
 *              of a given application over the last 7 days.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {string} req.params.id_app - The application identifier to query metrics for
 *
 * @returns {void} Sends JSON response with HTTP status code
 *
 * @response {200} Success - Returns average deployment time and period evaluated
 * @response {404} Not Found - Application not found or no deployments in the period
 * @response {500} Internal Server Error - Unexpected infrastructure or runtime error
 *
 * @openapi
 * /api/v1/metrics/average-time/{id_app}:
 *   get:
 *     summary: Get average deployment time for an application
 *     description: Returns the average time of successful deployments for the last 7 days
 *     tags:
 *       - Metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_app
 *         required: true
 *         schema:
 *           type: string
 *         description: The application identifier
 *     responses:
 *       200:
 *         description: Average deployment time retrieved successfully
 *       404:
 *         description: Application not found or no deployments in the evaluated period
 *       500:
 *         description: Internal server error
 */
const getAverageDeploymentTime = async (req, res) => {
  const { id_app } = req.params;

  try {
    const result = await metricsService.getAverageDeploymentTime(id_app);

    if (!result) {
      return res.status(404).json({
        message: `No deployment data found for application '${id_app}' in the last 7 days`,
      });
    }

    return res.status(200).json({
      id_app: result.id_app,
      average_time: result.average_time,
      period: result.period,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.code === 'NOT_FOUND') {
      logger.warn(`Metrics not found for id_app: ${id_app} - ${error.message}`);
      return res.status(404).json({
        message: `No deployment data found for application '${id_app}' in the last 7 days`,
      });
    }

    logger.error(`Error retrieving average deployment time for id_app: ${id_app}`, {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      message: 'An unexpected error occurred while retrieving deployment metrics',
    });
  }
};

module.exports = {
  getAverageDeploymentTime,
};