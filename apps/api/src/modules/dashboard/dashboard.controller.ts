/**
 * Dashboard Controller
 * Orchestrator: handles HTTP, injects dependencies (time), manages errors
 */

import type { FastifyReply } from 'fastify';
import type { AuthenticatedRequest } from '../../common/middleware/auth.middleware.js';
import { dashboardService } from './dashboard.service.js';

export class DashboardController {
  async getMetrics(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      const fundId = request.user.fundId;

      if (!fundId) {
        reply.status(400).send({
          success: false,
          error: 'User is not associated with a fund',
        });
        return;
      }

      // Inject current time for deterministic calculations
      const currentDate = new Date();

      const metrics = await dashboardService.getMetrics(fundId, currentDate);

      reply.send({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('[DashboardController] getMetrics error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard metrics',
      });
    }
  }
}

export const dashboardController = new DashboardController();

