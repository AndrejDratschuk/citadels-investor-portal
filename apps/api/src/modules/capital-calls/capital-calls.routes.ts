import { FastifyInstance } from 'fastify';
import { capitalCallsController } from './capital-calls.controller';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function capitalCallsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get all capital calls
  fastify.get('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getAll(request as AuthenticatedRequest, reply);
  });

  // Get a single capital call
  fastify.get('/:id', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getById(request as AuthenticatedRequest, reply);
  });

  // Create a new capital call
  fastify.post('/', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.create(request as AuthenticatedRequest, reply);
  });

  // Get capital call items for a specific capital call
  fastify.get('/:id/items', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.getItems(request as AuthenticatedRequest, reply);
  });

  // Confirm wire received for a capital call item
  fastify.post('/:id/items/:itemId/confirm-wire', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.confirmWire(request as AuthenticatedRequest, reply);
  });

  // Report wire issue for a capital call item
  fastify.post('/:id/items/:itemId/report-issue', { preHandler: managerPreHandler }, async (request, reply) => {
    return capitalCallsController.reportWireIssue(request as AuthenticatedRequest, reply);
  });
}

