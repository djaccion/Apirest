const logger = require('../utils/logger');
const SyncService = require('../services/sync.service');

const syncUsers = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      const error = new Error('Request body is required');
      error.statusCode = 400;
      return next(error);
    }

    const { users, source } = req.body;

    logger.info('Starting user synchronization', {
      userId: req.user && req.user.id,
      source: source || 'unknown',
    });

    const result = await SyncService.syncUsers({ users, source });

    return res.json({
      message: 'User synchronization completed successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { syncUsers };