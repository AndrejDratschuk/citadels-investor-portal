import { FastifyReply, FastifyRequest } from 'fastify';
import { InvestorsService } from './investors.service';
import { stakeholderRolesService } from '../stakeholders';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { createInvestorSchema } from './dtos/createInvestor.dto';
import { updateInvestorSchema } from './dtos/updateInvestor.dto';
import { stakeholderTypeSchema } from '@altsui/shared';
import type { StakeholderType } from '@altsui/shared';

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

    console.log('[Investors.getAll] Manager fund_id:', manager.fund_id, 'user_id:', request.user.id);
    const investors = await investorsService.getAllByFundId(manager.fund_id);
    console.log('[Investors.getAll] Found', investors.length, 'investors for fund');

    return reply.send({
      success: true,
      data: investors,
    });
  }

  /**
   * Create an investor for the manager's fund (manager view)
   */
  async create(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    const input = createInvestorSchema.parse(request.body);
    const created = await investorsService.createInvestorForFund({
      fundId: manager.fund_id,
      ...input,
    });

    return reply.send({
      success: true,
      data: created,
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
   * Get investor's deal investments (manager view)
   */
  async getInvestorDeals(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    try {
      const investments = await investorsService.getInvestorInvestments(id);
      
      return reply.send({
        success: true,
        data: investments,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch investor deals',
      });
    }
  }

  /**
   * Update an investor by ID (manager view)
   */
  async update(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      const input = updateInvestorSchema.parse(request.body);
      const updated = await investorsService.updateInvestorById(id, manager.fund_id, input);

      return reply.send({
        success: true,
        data: updated,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update investor';
      return reply.status(400).send({ success: false, error: message });
    }
  }

  /**
   * Delete an investor by ID (manager view)
   */
  async delete(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    try {
      await investorsService.deleteInvestorById(id, manager.fund_id);

      return reply.send({
        success: true,
        message: 'Investor deleted successfully',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete investor';
      return reply.status(400).send({ success: false, error: message });
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

  /**
   * Get current investor's communications
   */
  async getMyCommunications(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    try {
      const investor = await investorsService.getInvestorByUserId(request.user.id);
      console.log('[getMyCommunications] User ID:', request.user.id);
      console.log('[getMyCommunications] Found investor:', investor.id, investor.email);
      
      const communications = await investorsService.getInvestorCommunications(investor.id);
      console.log('[getMyCommunications] Found communications:', communications.length);

      return reply.send({
        success: true,
        data: communications,
      });
    } catch (error: any) {
      console.error('[getMyCommunications] Error:', error.message);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch communications',
      });
    }
  }

  /**
   * Mark a communication as read
   */
  async markCommunicationRead(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const investor = await investorsService.getInvestorByUserId(request.user.id);

    try {
      const communication = await investorsService.markCommunicationRead(id, investor.id);
      return reply.send({
        success: true,
        data: communication,
      });
    } catch (error) {
      return reply.status(404).send({ success: false, error: 'Communication not found' });
    }
  }

  /**
   * Update communication tags
   */
  async updateCommunicationTags(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const { tags } = request.body as { tags: string[] };
    const investor = await investorsService.getInvestorByUserId(request.user.id);

    try {
      const communication = await investorsService.updateCommunicationTags(id, investor.id, tags);
      return reply.send({
        success: true,
        data: communication,
      });
    } catch (error) {
      return reply.status(404).send({ success: false, error: 'Communication not found' });
    }
  }

  /**
   * Get fund contact info for investor
   */
  async getFundContact(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    try {
      console.log('[getFundContact] Request from user:', request.user.email);
      const investor = await investorsService.getInvestorByUserId(request.user.id);
      console.log('[getFundContact] Found investor:', investor.email, 'fundId:', investor.fundId);
      
      const fundContact = await investorsService.getFundContact(investor.fundId);

      return reply.send({
        success: true,
        data: fundContact,
      });
    } catch (error: any) {
      console.error('[getFundContact] Error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get fund contact',
      });
    }
  }

  /**
   * Send email to fund (investor -> fund manager)
   */
  async sendEmailToFund(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { subject, body } = request.body as { subject: string; body: string };

    if (!subject || !body) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: subject, body',
      });
    }

    try {
      const investor = await investorsService.getInvestorByUserId(request.user.id);
      const result = await investorsService.sendEmailToFund(investor, subject, body);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[sendEmailToFund] Error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send email',
      });
    }
  }

  // ============================================
  // Permission Management Routes
  // ============================================

  /**
   * Get current investor's effective permissions
   */
  async getMyPermissions(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    try {
      const investor = await investorsService.getInvestorByUserId(request.user.id);
      const permissions = await stakeholderRolesService.getPermissionsForInvestor(investor.id);

      return reply.send({
        success: true,
        data: permissions,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get permissions';
      console.error('[getMyPermissions] Error:', message);
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Get all permission configurations for a fund (manager view)
   * @deprecated Use /stakeholders/permissions instead
   */
  async getFundPermissions(request: AuthenticatedRequest, reply: FastifyReply) {
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

    try {
      const permissions = await stakeholderRolesService.getAllRolesForFund(manager.fund_id);

      return reply.send({
        success: true,
        data: permissions,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get fund permissions';
      console.error('[getFundPermissions] Error:', message);
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }

  /**
   * Update permission configuration for an investor type (manager view)
   * @deprecated Use /stakeholders/permissions/:stakeholderType instead
   */
  async updateTypePermissions(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { investorType: rawStakeholderType } = request.params as { investorType: string };

    // Validate stakeholderType URL parameter
    const stakeholderTypeResult = stakeholderTypeSchema.safeParse(rawStakeholderType);
    if (!stakeholderTypeResult.success) {
      return reply.status(400).send({
        success: false,
        error: `Invalid stakeholder type: ${rawStakeholderType}`,
      });
    }
    const stakeholderType = stakeholderTypeResult.data as StakeholderType;

    // Get the manager's fund
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id')
      .eq('id', request.user.id)
      .single();

    if (managerError || !manager?.fund_id) {
      return reply.status(404).send({ success: false, error: 'Fund not found' });
    }

    // This endpoint is deprecated - use /api/stakeholders/roles/:roleId/permissions instead
    return reply.status(410).send({
      success: false,
      error: 'This endpoint is deprecated. Use /api/stakeholders/roles/:roleId/permissions instead.',
    });
  }

  /**
   * Seed default permissions for a fund (manager view)
   * @deprecated Use /stakeholders/permissions/seed instead
   */
  async seedFundPermissions(request: AuthenticatedRequest, reply: FastifyReply) {
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

    try {
      const permissions = await stakeholderRolesService.initializeRolesForFund(manager.fund_id);

      return reply.send({
        success: true,
        data: permissions,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to seed permissions';
      console.error('[seedFundPermissions] Error:', message);
      return reply.status(500).send({
        success: false,
        error: message,
      });
    }
  }
}


