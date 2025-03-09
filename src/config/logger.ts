import pino, { Logger, LoggerOptions } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const loggerConfig: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    transport: isDevelopment
        ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                },
            }
        : undefined,
    serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
    },
};

const logger: Logger = pino(loggerConfig);

Object.freeze(logger);

export default logger;
