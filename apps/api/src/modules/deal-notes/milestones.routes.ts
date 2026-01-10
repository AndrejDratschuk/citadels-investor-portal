/**
 * Milestones Routes
 */

import type { FastifyInstance } from 'fastify';
import { MilestonesController } from './milestones.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const milestonesController = new MilestonesController();

export async function milestonesRoutes(fastify: FastifyInstance): Promise<void> {
  // List milestones for a deal
  fastify.get('/deals/:dealId/milestones', { preHandler: [authenticate] }, async (request, reply) => {
    return milestonesController.list(request as any, reply);
  });

  // Create a milestone
  fastify.post('/deals/:dealId/milestones', { preHandler: [authenticate] }, async (request, reply) => {
    return milestonesController.create(request as any, reply);
  });

  // Update a milestone
  fastify.put('/deals/:dealId/milestones/:milestoneId', { preHandler: [authenticate] }, async (request, reply) => {
    return milestonesController.update(request as any, reply);
  });

  // Delete a milestone
  fastify.delete('/deals/:dealId/milestones/:milestoneId', { preHandler: [authenticate] }, async (request, reply) => {
    return milestonesController.delete(request as any, reply);
  });
}

