import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
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

    // File uploads
    await fastify.register(multipart, {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB max
      },
    });

    // Error handler
    fastify.setErrorHandler(errorHandler);

    // Health check endpoint (root level)
    fastify.get('/', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    fastify.get('/health', async (request, reply) => {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(registerRoutes, { prefix: '/api' });

    // Use Railway's PORT or fallback to env.PORT
    const port = parseInt(process.env.PORT || String(env.PORT), 10);
    
    // Start server
    const address = await fastify.listen({
      port: port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server listening on port ${port}`);
    console.log(`🚀 Server address: ${address}`);
    fastify.log.info(`Server listening on ${address}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

