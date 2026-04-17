const morgan = require('morgan');
const logger = require('../config/logger');

const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const environment = process.env.NODE_ENV || 'development';

const morganFormat = environment === 'production' ? 'combined' : 'dev';

const skipLogging = (req, res) => {
  return process.env.NODE_ENV === 'test';
};

module.exports = morgan(morganFormat, {
  stream: morganStream,
  skip: skipLogging,
});