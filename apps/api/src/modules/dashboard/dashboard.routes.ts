/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints - following CODE_GUIDELINES.md
 */

import { FastifyInstance } from 'fastify';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // Get fund dashboard statistics
  fastify.get(
    '/stats',
    {
      preHandler: [authenticate],
    },
    (request, reply) => dashboardController.getStats(request as any, reply)
  );
}

