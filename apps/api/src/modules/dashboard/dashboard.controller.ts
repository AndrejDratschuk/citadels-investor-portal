/**
 * Dashboard Controller (Entry Point)
 * Validates at boundary, injects dependencies - following CODE_GUIDELINES.md
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service';
import { dashboardStatsQuerySchema } from './dashboard.schema';

// ============================================
// Request Types
// ============================================

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    fundId: string | null;
    role: string;
  };
}

// ============================================
// Controller Class
// ============================================

export class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Returns aggregated fund dashboard statistics
   */
  async getStats(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    // Boundary validation with Zod
    const validation = dashboardStatsQuerySchema.safeParse(request.query);

    if (!validation.success) {
      reply.status(400).send({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.flatten(),
      });
      return;
    }

    const { fundId } = request.user;
    const { includeKpis, kpiLimit } = validation.data;

    if (!fundId) {
      reply.status(400).send({
        success: false,
        error: 'No fund associated with user',
        message: 'Please create or join a fund first',
      });
      return;
    }

    try {
      // Inject Date for strict determinism
      const stats = await dashboardService.getFundStats(
        fundId,
        { includeKpis, kpiLimit },
        { now: new Date() }
      );

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Dashboard controller error:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch dashboard statistics',
      });
    }
  }
}

export const dashboardController = new DashboardController();

