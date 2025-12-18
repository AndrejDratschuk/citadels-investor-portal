import { FastifyInstance } from 'fastify';
import { capitalCallsController } from './capital-calls.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function capitalCallsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get all capital calls
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getAll(request as any, reply);
  });

  // Get a single capital call
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getById(request as any, reply);
  });

  // Create a new capital call
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.create(request as any, reply);
  });
}

