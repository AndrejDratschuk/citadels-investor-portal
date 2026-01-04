import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { reportsService } from './reports.service';

export class ReportsController {
  /**
   * Get fund-level metrics
   * GET /api/reports/fund
   */
  async getFundMetrics(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const metrics = await reportsService.getFundMetrics(fundId);

      return reply.send({
        success: true,
        data: metrics,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch fund metrics';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get deal summaries for selection UI
   * GET /api/reports/deals
   */
  async getDealSummaries(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deals = await reportsService.getDealSummaries(fundId);

      return reply.send({
        success: true,
        data: deals,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch deal summaries';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get aggregated deal rollups
   * GET /api/reports/deals/rollup?dealIds=id1,id2,id3
   */
  async getDealRollups(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    // Parse and validate dealIds from query string (only accept valid UUIDs)
    const { dealIds } = request.query as { dealIds?: string };
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const dealIdArray = dealIds
      ? dealIds.split(',').filter((id) => id && UUID_REGEX.test(id))
      : undefined;

    try {
      const rollup = await reportsService.getDealRollups(fundId, dealIdArray);

      return reply.send({
        success: true,
        data: rollup,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch deal rollups';
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }
}

export const reportsController = new ReportsController();

