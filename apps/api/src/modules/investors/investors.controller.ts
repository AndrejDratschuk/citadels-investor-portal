import { FastifyReply } from 'fastify';
import { InvestorsService } from './investors.service';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';

const investorsService = new InvestorsService();

export class InvestorsController {
  /**
   * Get current investor profile
   */
  async getMe(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);

    return reply.send({
      success: true,
      data: investor,
    });
  }

  /**
   * Update current investor profile
   */
  async updateMe(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);
    const updates = request.body as any;

    const updated = await investorsService.updateInvestor(investor.id, updates);

    return reply.send({
      success: true,
      data: updated,
    });
  }

  /**
   * Get current investor's dashboard stats
   */
  async getMyStats(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);
    const stats = await investorsService.getInvestorStats(investor.id);

    return reply.send({
      success: true,
      data: stats,
    });
  }

  /**
   * Get current investor's investments
   */
  async getMyInvestments(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);
    const investments = await investorsService.getInvestorInvestments(investor.id);

    return reply.send({
      success: true,
      data: investments,
    });
  }

  /**
   * Get current investor's documents
   */
  async getMyDocuments(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);
    const documents = await investorsService.getInvestorDocuments(
      investor.id,
      investor.fundId
    );

    return reply.send({
      success: true,
      data: documents,
    });
  }

  /**
   * Get current investor's capital calls
   */
  async getMyCapitalCalls(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const investor = await investorsService.getInvestorByUserId(request.user.id);
    const capitalCalls = await investorsService.getInvestorCapitalCalls(investor.id);

    return reply.send({
      success: true,
      data: capitalCalls,
    });
  }
}


