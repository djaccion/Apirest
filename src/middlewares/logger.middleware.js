const crypto = require('crypto');

function sanitizeUrl(url) {
  try {
    const sensitiveParams = ['password', 'token', 'secret', 'apikey'];
    const [path, queryString] = url.split('?');

    if (!queryString) {
      return url;
    }

    const sanitizedParams = queryString
      .split('&')
      .map((param) => {
        const [key, value] = param.split('=');
        const lowerKey = key ? key.toLowerCase() : '';
        if (sensitiveParams.includes(lowerKey)) {
          return `${key}=[REDACTED]`;
        }
        return param;
      })
      .join('&');

    return `${path}?${sanitizedParams}`;
  } catch (e) {
    return url;
  }
}

function loggerMiddleware(req, res, next) {
  if (req.originalUrl === '/api/health') {
    return next();
  }

  const correlationId = crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  const startTime = Date.now();

  res.on('finish', () => {
    const responseTimeMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    let level;
    if (statusCode >= 500) {
      level = 'ERROR';
    } else if (statusCode >= 400) {
      level = 'WARN';
    } else {
      level = 'INFO';
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      correlationId,
      method: req.method,
      url: sanitizeUrl(req.originalUrl),
      statusCode,
      responseTimeMs,
      ip: req.ip || (req.connection && req.connection.remoteAddress) || '',
      userAgent: req.headers['user-agent'] || '',
      userId: req.user ? req.user.id : null,
    };

    const serialized = JSON.stringify(logEntry);

    if (level === 'ERROR') {
      console.error(serialized);
    } else if (level === 'WARN') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  });

  next();
}

module.exports = loggerMiddleware;