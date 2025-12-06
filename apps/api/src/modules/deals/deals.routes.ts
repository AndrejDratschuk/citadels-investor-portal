import { FastifyInstance } from 'fastify';
import { dealsController } from './deals.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function dealsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get all deals
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return dealsController.getAll(request as any, reply);
  });

  // Get a single deal
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return dealsController.getById(request as any, reply);
  });

  // Create a deal
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return dealsController.create(request as any, reply);
  });

  // Update a deal
  fastify.patch('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return dealsController.update(request as any, reply);
  });

  // Delete a deal
  fastify.delete('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return dealsController.delete(request as any, reply);
  });
}

