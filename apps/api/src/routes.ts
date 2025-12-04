import { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { investorsRoutes } from './modules/investors/investors.routes';
import { webhooksRoutes } from './modules/webhooks/webhooks.routes';
import { communicationsRoutes } from './modules/communications/communications.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all module routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(investorsRoutes, { prefix: '/investors' });
  await fastify.register(webhooksRoutes, { prefix: '/webhooks' });
  await fastify.register(communicationsRoutes); // No prefix, routes have full paths

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

