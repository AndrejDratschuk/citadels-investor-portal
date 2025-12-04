import { FastifyInstance } from 'fastify';
import { CommunicationsController } from './communications.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

const communicationsController = new CommunicationsController();

export async function communicationsRoutes(fastify: FastifyInstance) {
  // Get all communications for an investor
  fastify.get(
    '/investors/:investorId/communications',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.getByInvestorId(request, reply);
    }
  );

  // Log any type of communication
  fastify.post(
    '/investors/:investorId/communications',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.create(request as any, reply);
    }
  );

  // Delete a communication
  fastify.delete(
    '/communications/:communicationId',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.delete(request as any, reply);
    }
  );
}


