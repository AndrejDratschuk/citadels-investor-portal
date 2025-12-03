import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { registerRoutes } from './routes';
import { errorHandler } from './common/middleware/error-handler';
import { env } from './config/env';

const fastify = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register plugins
async function start() {
  try {
    // Security
    await fastify.register(helmet);
    await fastify.register(cors, {
      origin: true, // Allow all origins (or set specific domains via env)
      credentials: true,
    });

    // Error handler
    fastify.setErrorHandler(errorHandler);

    // Register routes
    await fastify.register(registerRoutes, { prefix: '/api' });

    // Start server
    const address = await fastify.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    fastify.log.info(`Server listening on ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

