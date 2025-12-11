import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { dealsService, CreateDealInput } from './deals.service';

export class DealsController {
  /**
   * Get all deals for the fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deals = await dealsService.getAllByFundId(fundId);

      return reply.send({
        success: true,
        data: deals,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deals',
      });
    }
  }

  /**
   * Get a single deal by ID
   */
  async getById(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      const deal = await dealsService.getById(fundId, id);

      if (!deal) {
        return reply.status(404).send({
          success: false,
          error: 'Deal not found',
        });
      }

      return reply.send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch deal',
      });
    }
  }

  /**
   * Create a new deal
   */
  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const input = request.body as CreateDealInput;

    if (!input.name) {
      return reply.status(400).send({
        success: false,
        error: 'Deal name is required',
      });
    }

    try {
      const deal = await dealsService.create(fundId, input);

      return reply.status(201).send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create deal',
      });
    }
  }

  /**
   * Update a deal
   */
  async update(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    const input = request.body as Partial<CreateDealInput>;

    try {
      const deal = await dealsService.update(fundId, id, input);

      return reply.send({
        success: true,
        data: deal,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update deal',
      });
    }
  }

  /**
   * Delete a deal
   */
  async delete(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;
    const { id } = request.params as { id: string };

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'No fund associated with this user',
      });
    }

    try {
      await dealsService.delete(fundId, id);

      return reply.send({
        success: true,
        data: { message: 'Deal deleted successfully' },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete deal',
      });
    }
  }
}

export const dealsController = new DealsController();





