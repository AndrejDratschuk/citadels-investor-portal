import { FastifyInstance } from 'fastify';
import { CommunicationsController } from './communications.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

const communicationsController = new CommunicationsController();

export async function communicationsRoutes(fastify: FastifyInstance) {
  // Get all communications for the fund (manager view)
  fastify.get(
    '/communications',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.getAll(request as any, reply);
    }
  );

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

  // Get unread communication count (manager) - must come before :id routes
  fastify.get(
    '/communications/unread-count',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.getUnreadCount(request as any, reply);
    }
  );

  // Mark a communication as read (manager)
  fastify.patch(
    '/communications/:id/read',
    { preHandler: [authenticate, requireManager] },
    async (request, reply) => {
      return communicationsController.markAsRead(request as any, reply);
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


