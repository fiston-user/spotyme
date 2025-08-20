import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// Only use pino-pretty in development when it's available
let transport;
if (isDevelopment && !isTest && !isProduction) {
  try {
    // Check if pino-pretty is available
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        messageFormat: '{msg}',
        errorLikeObjectKeys: ['err', 'error'],
        levelFirst: true,
        minimumLevel: process.env.LOG_LEVEL || 'debug',
      }
    };
  } catch {
    // pino-pretty not available, use default transport
    transport = undefined;
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport,
  // Add context information
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'accessToken', 'refreshToken', 'password'],
    censor: '[REDACTED]'
  },
  // Better error serialization
  serializers: {
    error: pino.stdSerializers.err,
    err: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.params,
      query: req.query,
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};

export default logger;