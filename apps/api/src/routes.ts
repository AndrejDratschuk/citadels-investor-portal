import { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { investorsRoutes } from './modules/investors/investors.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all module routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(investorsRoutes, { prefix: '/investors' });
  await fastify.register(webhooksRoutes, { prefix: '/webhooks' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

