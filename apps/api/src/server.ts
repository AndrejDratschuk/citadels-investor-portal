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
    // CORS must be registered BEFORE other plugins
    await fastify.register(cors, {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'https://citadel-investor-portal-api-olde.vercel.app',
        /\.vercel\.app$/,  // Allow all Vercel preview deployments
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Security (register after CORS)
    await fastify.register(helmet, {
      crossOriginResourcePolicy: { policy: 'cross-origin' },
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

