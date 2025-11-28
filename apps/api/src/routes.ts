import { FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all module routes
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

