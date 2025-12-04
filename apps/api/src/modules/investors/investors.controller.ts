import { FastifyReply, FastifyRequest } from 'fastify';
import { InvestorsService } from './investors.service';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';

const investorsService = new InvestorsService();

export class InvestorsController {
  /**
   * Get all investors for a fund (manager view)
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    const investors = await investorsService.getAllByFundId(manager.fund_id);

    return reply.send({
      success: true,
      data: investors,
    });
  }

  /**
   * Get a single investor by ID (manager view)
   */
  async getById(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    try {
      const investor = await investorsService.getInvestorById(id);
      
      return reply.send({
        success: true,
        data: investor,
      });
    } catch (error) {
      return reply.status(404).send({ success: false, error: 'Investor not found' });
    }
  }

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


