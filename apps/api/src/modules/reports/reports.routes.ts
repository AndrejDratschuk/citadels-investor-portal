import { FastifyInstance } from 'fastify';
import { reportsController } from './reports.controller';
import { authenticate, AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { requireManager } from '../../common/middleware/rbac.middleware';

export async function reportsRoutes(fastify: FastifyInstance) {
  const managerPreHandler = [authenticate, requireManager];

  // Get fund-level metrics
  fastify.get('/fund', { preHandler: managerPreHandler }, async (request: AuthenticatedRequest, reply) => {
    return reportsController.getFundMetrics(request, reply);
  });

  // Get deal summaries for selection UI
  fastify.get('/deals', { preHandler: managerPreHandler }, async (request: AuthenticatedRequest, reply) => {
    return reportsController.getDealSummaries(request, reply);
  });

  // Get aggregated deal rollups
  fastify.get('/deals/rollup', { preHandler: managerPreHandler }, async (request: AuthenticatedRequest, reply) => {
    return reportsController.getDealRollups(request, reply);
  });
}

