import { FastifyRequest, FastifyReply } from 'fastify';
import { KYCService, KYCApplicationData } from './kyc.service';
import { supabaseAdmin } from '../../common/database/supabase';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';

const kycService = new KYCService();

interface StartKYCBody {
  fundCode: string;
  email: string;
}

interface UpdateKYCBody extends Partial<KYCApplicationData> {}

interface UpdateCalendlyBody {
  eventUrl: string;
}

export class KYCController {
  /**
   * Start a new KYC application
   */
  async start(request: FastifyRequest, reply: FastifyReply) {
    const { fundCode, email } = request.body as StartKYCBody;

    if (!fundCode || !email) {
      return reply.status(400).send({
        success: false,
        error: 'Fund code and email are required',
      });
    }

    // Look up fund by code (using name or a code field)
    const { data: fund, error: fundError } = await supabaseAdmin
      .from('funds')
      .select('id')
      .eq('name', fundCode)
      .single();

    // If not found by name, try to find by ID directly
    let fundId = fund?.id;
    if (!fundId) {
      const { data: fundById } = await supabaseAdmin
        .from('funds')
        .select('id')
        .eq('id', fundCode)
        .single();
      fundId = fundById?.id;
    }

    if (!fundId) {
      return reply.status(404).send({
        success: false,
        error: 'Fund not found',
      });
    }

    try {
      const application = await kycService.create(fundId, email);

      return reply.status(201).send({
        success: true,
        data: application,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to create KYC application',
      });
    }
  }

  /**
   * Get KYC application by ID
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    try {
      const application = await kycService.getById(id);

      return reply.send({
        success: true,
        data: application,
      });
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        error: 'KYC application not found',
      });
    }
  }

  /**
   * Update KYC application (autosave)
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const updates = request.body as UpdateKYCBody;

    try {
      const application = await kycService.update(id, updates);

      return reply.send({
        success: true,
        data: application,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update KYC application',
      });
    }
  }

  /**
   * Submit KYC application
   */
  async submit(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    try {
      const result = await kycService.submit(id);

      return reply.send({
        success: true,
        data: result.application,
        eligible: result.eligible,
        message: result.eligible
          ? 'Congratulations! You are pre-qualified as an accredited investor.'
          : 'Unfortunately, you do not meet the accreditation requirements at this time.',
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to submit KYC application',
      });
    }
  }

  /**
   * Update Calendly event after scheduling
   */
  async updateCalendly(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { eventUrl } = request.body as UpdateCalendlyBody;

    if (!eventUrl) {
      return reply.status(400).send({
        success: false,
        error: 'Event URL is required',
      });
    }

    try {
      const application = await kycService.updateCalendlyEvent(id, eventUrl);

      return reply.send({
        success: true,
        data: application,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update Calendly event',
      });
    }
  }

  // ==================== Manager Methods ====================

  /**
   * Get all KYC applications for the manager's fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply) {
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'Manager is not associated with a fund',
      });
    }

    try {
      const applications = await kycService.getAllByFundId(fundId);

      return reply.send({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch KYC applications',
      });
    }
  }

  /**
   * Approve a KYC application
   */
  async approve(request: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    try {
      const application = await kycService.approve(id);

      return reply.send({
        success: true,
        data: application,
        message: 'KYC application approved',
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to approve KYC application',
      });
    }
  }

  /**
   * Reject a KYC application
   */
  async reject(request: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };

    try {
      const application = await kycService.reject(id, reason);

      return reply.send({
        success: true,
        data: application,
        message: 'KYC application rejected',
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to reject KYC application',
      });
    }
  }
}

