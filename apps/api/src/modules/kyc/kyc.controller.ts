import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { KYCService, KYCApplicationData } from './kyc.service';
import { supabaseAdmin } from '../../common/database/supabase';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { InterestFormInputSchema } from '@flowveda/shared';
import { prospectsRepository } from '../prospects/prospects.repository';
import { prospectsService } from '../prospects/prospects.service';
import { ProspectEmailTriggers } from '../prospects/prospectEmailTriggers';
import { emailService } from '../email/email.service';

const kycService = new KYCService();

interface StartKYCBody {
  fundCode: string;
  email: string;
}

interface UpdateKYCBody extends Partial<KYCApplicationData> {}

interface UpdateCalendlyBody {
  eventUrl: string;
}

interface InterestFormBody {
  email: string;
  name: string;
  phone?: string;
  fundId: string;
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
   * Submit interest form (creates prospect and auto-sends KYC link)
   * Public route - no auth required
   */
  async submitInterest(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = InterestFormInputSchema.parse(request.body);
      
      // Check if fund exists
      const { data: fund, error: fundError } = await supabaseAdmin
        .from('funds')
        .select('id, name')
        .eq('id', input.fundId)
        .single();

      if (fundError || !fund) {
        return reply.status(404).send({
          success: false,
          error: 'Fund not found',
        });
      }

      // Check if prospect already exists
      const existing = await prospectsRepository.findByEmail(input.email, input.fundId);
      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'You have already expressed interest in this fund. Please check your email for the KYC form link.',
        });
      }

      // Generate IDs and prepare prospect data
      const id = crypto.randomUUID();
      const token = crypto.randomUUID();
      const now = new Date();

      const prospectData = prospectsService.prepareInterestFormProspect(
        input.email,
        input.name,
        input.phone,
        input.fundId,
        id,
        token,
        now
      );

      // Create prospect
      const prospect = await prospectsRepository.create(prospectData);

      // Send auto-KYC email
      const emailTriggers = new ProspectEmailTriggers(emailService);
      await emailTriggers.onInterestFormSubmitted(prospect, fund.name);

      return reply.status(201).send({
        success: true,
        message: 'Thank you for your interest! Please check your email for the next steps.',
        data: {
          prospectId: prospect.id,
        },
      });
    } catch (error: any) {
      console.error('Error submitting interest form:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to submit interest form',
      });
    }
  }

  /**
   * Get KYC application by token (for manual sends)
   */
  async getByToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.params as { token: string };

    try {
      const prospect = await prospectsRepository.findByToken(token);

      if (!prospect) {
        return reply.status(404).send({
          success: false,
          error: 'Invalid or expired KYC link',
        });
      }

      // Return the prospect data for the KYC form to use
      return reply.send({
        success: true,
        data: {
          prospectId: prospect.id,
          fundId: prospect.fundId,
          fundName: prospect.fundName,
          email: prospect.email,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          phone: prospect.phone,
          status: prospect.status,
        },
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch KYC application',
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
        data: {
          application: result.application,
          message: result.message,
        },
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

  /**
   * Update KYC application status
   */
  async updateStatus(request: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { status, reason } = request.body as { status: string; reason?: string };

    if (!status) {
      return reply.status(400).send({
        success: false,
        error: 'Status is required',
      });
    }

    try {
      const application = await kycService.updateStatus(id, status, reason);

      return reply.send({
        success: true,
        data: application,
        message: `KYC application status updated to ${status}`,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to update KYC application status',
      });
    }
  }

  /**
   * Send account creation invite email to KYC applicant
   */
  async sendAccountInvite(request: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const fundId = request.user?.fundId;

    if (!fundId) {
      return reply.status(400).send({
        success: false,
        error: 'Manager is not associated with a fund',
      });
    }

    try {
      const result = await kycService.sendAccountInvite(id, fundId);

      return reply.send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to send account invite',
      });
    }
  }
}

