import { FastifyInstance } from 'fastify';
import { fundsController } from './funds.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function fundsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // ==================== Public Routes ====================

  // Get fund branding (public - for forms)
  fastify.get('/branding/:fundId', async (request, reply) => {
    return fundsController.getBranding(request, reply);
  });

  // ==================== Authenticated Routes ====================

  // Get current fund
  fastify.get('/current', { preHandler: managerPreHandler }, async (request, reply) => {
    return fundsController.getCurrent(request as any, reply);
  });

  // Update branding (colors)
  fastify.patch('/branding', { preHandler: managerPreHandler }, async (request, reply) => {
    return fundsController.updateBranding(request as any, reply);
  });

  // Upload logo
  fastify.post('/logo', { preHandler: managerPreHandler }, async (request, reply) => {
    return fundsController.uploadLogo(request as any, reply);
  });

  // Delete logo
  fastify.delete('/logo', { preHandler: managerPreHandler }, async (request, reply) => {
    return fundsController.deleteLogo(request as any, reply);
  });
}

