export function buildSuccess(message, data = null, statusCode = 200) {
  if (typeof message !== 'string' || !message) {
    return {
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        message: 'buildSuccess requires a valid message string',
        details: null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: process.env.npm_package_version,
      },
    };
  }

  return {
    success: true,
    statusCode,
    message,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: process.env.npm_package_version,
    },
  };
}

export function buildError(message, statusCode, details = null) {
  if (typeof message !== 'string' || !message || typeof statusCode !== 'number') {
    return {
      success: false,
      statusCode: 500,
      message: 'Internal server error',
      data: null,
      error: {
        message: 'buildError requires a valid message string and numeric statusCode',
        details: null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        apiVersion: process.env.npm_package_version,
      },
    };
  }

  const safeDetails = process.env.NODE_ENV === 'production' ? null : details;

  return {
    success: false,
    statusCode,
    message,
    data: null,
    error: {
      message,
      details: safeDetails,
    },
    meta: {
      timestamp: new Date().toISOString(),
      apiVersion: process.env.npm_package_version,
    },
  };
}