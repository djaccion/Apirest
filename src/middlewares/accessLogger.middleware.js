const morgan = require('morgan');
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.sssZ' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join('logs', 'access.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console()
  );
}

morgan.token('remote-addr-custom', (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.connection.remoteAddress || req.socket.remoteAddress;
});

const morganFormat = ':remote-addr-custom :method :url :status :response-time ms - :user-agent';

const accessLoggerMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      const cleanMessage = message.trim();
      logger.info(cleanMessage);
    },
  },
});

module.exports = accessLoggerMiddleware;