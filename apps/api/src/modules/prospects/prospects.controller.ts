/**
 * Prospects Controller (Orchestrator Layer)
 * Handles flow, error handling, and dependency injection
 * Try/catch lives here
 * Injects time, UUIDs, calls repository and service
 */

import { FastifyReply } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../../common/middleware/auth.middleware';
import { supabaseAdmin } from '../../common/database/supabase';
import { ProspectsRepository, prospectsRepository } from './prospects.repository';
import { ProspectsService, prospectsService } from './prospects.service';
import { ProspectEmailTriggers } from './prospectEmailTriggers';
import { emailService } from '../email/email.service';
import {
  SendKYCInputSchema,
  UpdateProspectStatusInputSchema,
  ApproveDocumentsInputSchema,
  RejectDocumentsInputSchema,
  ConvertToInvestorInputSchema,
  ProspectFiltersSchema,
} from '@altsui/shared';
import type { ProspectStatus } from '@altsui/shared';

// Input schema for marking prospect as Considering
const MarkConsideringInputSchema = z.object({
  meetingRecapBullets: z.string().optional(),
});

// Input schema for marking prospect as Not a Fit
const MarkNotFitInputSchema = z.object({
  reason: z.string().optional(),
});

export class ProspectsController {
  private repository: ProspectsRepository;
  private service: ProspectsService;
  private emailTriggers: ProspectEmailTriggers;
  private generateUUID: () => string;
  private getCurrentTime: () => Date;

  constructor(
    repository?: ProspectsRepository,
    service?: ProspectsService,
    emailTriggers?: ProspectEmailTriggers,
    generateUUID?: () => string,
    getCurrentTime?: () => Date
  ) {
    this.repository = repository || prospectsRepository;
    this.service = service || prospectsService;
    this.emailTriggers = emailTriggers || new ProspectEmailTriggers(emailService);
    this.generateUUID = generateUUID || (() => crypto.randomUUID());
    this.getCurrentTime = getCurrentTime || (() => new Date());
  }

  /**
   * Get manager's fund info using the fundId from auth middleware
   */
  private async getManagerFundInfo(
    fundId: string | null,
    userId: string
  ): Promise<{
    fundId: string;
    fundName: string;
    managerName: string;
    managerTitle?: string;
    managerCredentials?: string;
    managerEmail: string;
    calendlyUrl?: string;
    investmentBriefDescriptor?: string;
    consideringSupportMessage?: string;
    platformName?: string;
    postMeetingRecapTemplate?: string;
    accreditationEducationContent?: string;
  } | null> {
    if (!fundId) {
      return null;
    }

    // Get manager info
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email, title, credentials')
      .eq('id', userId)
      .single();

    if (managerError) {
      console.error('[getManagerFundInfo] Error fetching manager:', managerError);
    }

    // Get fund info
    const { data: fund, error: fundError } = await supabaseAdmin
      .from('funds')
      .select(`
        name, 
        calendly_url, 
        investment_brief_descriptor,
        considering_support_message,
        platform_name,
        post_meeting_recap_template,
        accreditation_education_content
      `)
      .eq('id', fundId)
      .single();

    if (fundError) {
      console.error('[getManagerFundInfo] Error fetching fund:', fundError);
    }

    const fundName = fund?.name || 'Fund';
    const managerName = `${manager?.first_name || ''} ${manager?.last_name || ''}`.trim() || 'Fund Manager';

    console.log(`[getManagerFundInfo] Fund: ${fundName}, Manager: ${managerName}, FundId: ${fundId}`);

    return {
      fundId,
      fundName,
      managerName,
      managerTitle: manager?.title || undefined,
      managerCredentials: manager?.credentials || undefined,
      managerEmail: manager?.email || '',
      calendlyUrl: fund?.calendly_url || undefined,
      investmentBriefDescriptor: fund?.investment_brief_descriptor || undefined,
      consideringSupportMessage: fund?.considering_support_message || undefined,
      platformName: fund?.platform_name || undefined,
      postMeetingRecapTemplate: fund?.post_meeting_recap_template || undefined,
      accreditationEducationContent: fund?.accreditation_education_content || undefined,
    };
  }

  /**
   * Send KYC form to a new prospect
   */
  async sendKYC(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const input = SendKYCInputSchema.parse(request.body);
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);

      if (!managerInfo) {
        reply.status(404).send({ success: false, error: 'Fund not found' });
        return;
      }

      // Check if prospect already exists
      const existing = await this.repository.findByEmail(input.email, managerInfo.fundId);
      if (existing) {
        reply.status(400).send({
          success: false,
          error: 'A prospect with this email already exists for this fund',
        });
        return;
      }

      // Generate dependencies at orchestrator level
      const id = this.generateUUID();
      const token = this.generateUUID();
      const now = this.getCurrentTime();

      // Call pure service function
      const prospectData = this.service.prepareKYCSend(
        input,
        managerInfo.fundId,
        request.user.id,
        id,
        token,
        now
      );

      // Persist via repository
      const prospect = await this.repository.create(prospectData);

      // Trigger email
      await this.emailTriggers.onKYCSent(
        prospect,
        managerInfo.fundName,
        managerInfo.managerName,
        managerInfo.managerEmail
      );

      reply.status(201).send({ success: true, data: prospect });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error sending KYC:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to send KYC form',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Get all prospects for the manager's fund
   */
  async getAll(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo) {
        reply.status(404).send({ success: false, error: 'Fund not found' });
        return;
      }

      // Parse query filters
      const query = request.query as Record<string, string | undefined>;
      const filters = ProspectFiltersSchema.parse({
        status: query.status ? query.status.split(',') : undefined,
        source: query.source,
        search: query.search,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });

      const prospects = await this.repository.findByFundId(managerInfo.fundId, filters);

      reply.send({ success: true, data: prospects });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        });
      } else {
        console.error('Error fetching prospects:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch prospects',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Get pipeline statistics
   */
  async getStats(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo) {
        reply.status(404).send({ success: false, error: 'Fund not found' });
        return;
      }

      const stats = await this.repository.getStats(managerInfo.fundId);

      reply.send({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch pipeline stats',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get a single prospect by ID
   */
  async getById(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const prospect = await this.repository.findById(id);

      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access to this prospect's fund
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      reply.send({ success: true, data: prospect });
    } catch (error) {
      console.error('Error fetching prospect:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch prospect',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Update prospect status
   */
  async updateStatus(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = UpdateProspectStatusInputSchema.parse(request.body);
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate transition
      const validation = this.service.validateStatusTransition(
        prospect,
        input.status as ProspectStatus
      );
      if (!validation.valid) {
        reply.status(400).send({ success: false, error: validation.error });
        return;
      }

      const previousStatus = prospect.status;

      // Update status
      const updated = await this.repository.updateStatus(
        id,
        input.status as ProspectStatus,
        now
      );

      // Trigger appropriate email based on new status
      await this.emailTriggers.onStatusChanged(
        updated,
        previousStatus,
        managerInfo.fundName,
        managerInfo.calendlyUrl,
        managerInfo.managerName,
        now
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error updating status:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to update prospect status',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Approve prospect documents
   */
  async approveDocuments(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = ApproveDocumentsInputSchema.parse(request.body);
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate operation
      const validation = this.service.canApproveDocuments(prospect);
      if (!validation.valid) {
        reply.status(400).send({ success: false, error: validation.error });
        return;
      }

      // Update status to documents_approved
      const updated = await this.repository.updateStatus(
        id,
        'documents_approved' as ProspectStatus,
        now,
        { documentsApprovedAt: now }
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error approving documents:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to approve documents',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Reject prospect documents
   */
  async rejectDocuments(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = RejectDocumentsInputSchema.parse(request.body);
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      const previousStatus = prospect.status;

      // Update status to documents_rejected
      const updated = await this.repository.updateStatus(
        id,
        'documents_rejected' as ProspectStatus,
        now,
        {
          documentsRejectedAt: now,
          documentRejectionReason: input.reason,
        }
      );

      // Trigger rejection email
      await this.emailTriggers.onStatusChanged(
        updated,
        previousStatus,
        managerInfo.fundName,
        undefined,
        managerInfo.managerName,
        now
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error rejecting documents:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to reject documents',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Convert prospect to investor
   */
  async convertToInvestor(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = ConvertToInvestorInputSchema.parse(request.body);
      const now = this.getCurrentTime();
      const investorId = this.generateUUID();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate conversion
      const validation = this.service.canConvertToInvestor(prospect);
      if (!validation.valid) {
        reply.status(400).send({ success: false, error: validation.error });
        return;
      }

      // Prepare investor data
      const investorData = this.service.prepareInvestorConversion(
        prospect,
        input,
        investorId,
        now
      );

      // Create investor record
      await this.repository.createInvestorFromProspect(investorData);

      // Update prospect status to converted
      const updated = await this.repository.updateStatus(
        id,
        'converted' as ProspectStatus,
        now,
        {
          convertedToInvestor: true,
          convertedAt: now,
          investorId,
        }
      );

      // Send welcome email
      await this.emailTriggers.onConvertedToInvestor(
        updated,
        managerInfo.fundName,
        input.commitmentAmount,
        now,
        managerInfo.managerName,
        managerInfo.managerEmail
      );

      reply.send({
        success: true,
        data: {
          prospect: updated,
          investorId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error converting to investor:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to convert prospect to investor',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Update prospect notes
   */
  async updateNotes(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const { notes } = request.body as { notes: string };
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      const updated = await this.repository.updateNotes(id, notes, now);

      reply.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating notes:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to update notes',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Send KYC reminder
   */
  async sendReminder(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const { type } = request.body as { type: 'kyc' | 'onboarding' };

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Send appropriate reminder based on status
      if (type === 'kyc' && (prospect.status === 'kyc_sent' || prospect.status === 'submitted')) {
        await this.emailTriggers.sendKYCReminder(prospect, managerInfo.fundName);
      } else if (type === 'onboarding' && prospect.status === 'account_invite_sent') {
        // Resend the account invite email
        await this.emailTriggers.onAccountInviteSent(prospect, managerInfo.fundName, managerInfo.managerName);
      } else if (type === 'onboarding' && prospect.status === 'account_created') {
        await this.emailTriggers.sendOnboardingReminder(prospect, managerInfo.fundName);
      } else {
        reply.status(400).send({
          success: false,
          error: 'Reminder type does not match prospect status',
        });
        return;
      }

      reply.send({ success: true, message: 'Reminder sent successfully' });
    } catch (error) {
      console.error('Error sending reminder:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to send reminder',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Send DocuSign to prospect
   */
  async sendDocuSign(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Verify manager has access
      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Verify prospect is in correct status
      if (prospect.status !== 'documents_approved') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must have approved documents before sending DocuSign',
        });
        return;
      }

      // Import DocuSign service dynamically to avoid circular dependencies
      const { docuSignService } = await import('../docusign/docusign.service');

      // Check if DocuSign is configured for this fund
      const isDocuSignConfigured = await docuSignService.isConfiguredForFund(managerInfo.fundId);
      
      if (!isDocuSignConfigured) {
        // For now, just update status even if DocuSign isn't configured
        // In production, you'd want to actually send the envelope
        console.log(`[DocuSign] Not configured for fund ${managerInfo.fundId}, updating status only`);
        
        await this.repository.updateStatus(
          id,
          'docusign_sent' as ProspectStatus,
          new Date(),
          { docusignSentAt: new Date() }
        );

        reply.send({
          success: true,
          message: 'DocuSign status updated (DocuSign not configured - manual signing required)',
          envelopeId: null,
        });
        return;
      }

      // Get the investor linked to this prospect for DocuSign
      if (!prospect.investorId) {
        reply.status(400).send({
          success: false,
          error: 'No investor linked to this prospect',
        });
        return;
      }

      // TODO: Get subscription agreement template and create envelope
      // For now, just update status
      const envelopeId = `manual-${Date.now()}`; // Placeholder

      await this.repository.updateStatus(
        id,
        'docusign_sent' as ProspectStatus,
        new Date(),
        { 
          docusignEnvelopeId: envelopeId,
          docusignSentAt: new Date() 
        }
      );

      // Trigger email notification
      await this.emailTriggers.onDocuSignSent(prospect, managerInfo.fundName);

      reply.send({
        success: true,
        message: 'DocuSign sent successfully',
        envelopeId,
      });
    } catch (error) {
      console.error('Error sending DocuSign:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to send DocuSign',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Mark prospect as "Proceed" after meeting (sends account creation invite)
   */
  async markProceed(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const { postMeetingRecap } = (request.body as { postMeetingRecap?: string }) || {};
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate that prospect is in meeting_complete status
      if (prospect.status !== 'meeting_complete') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must be in meeting_complete status to mark as proceed',
        });
        return;
      }

      // Update to account_invite_sent status
      const updated = await this.repository.updateStatus(
        id,
        'account_invite_sent' as ProspectStatus,
        now
      );

      // Trigger Post-Meeting: Proceed email
      await this.emailTriggers.onMarkedProceed(
        updated,
        managerInfo.fundName,
        managerInfo.managerName,
        managerInfo.managerTitle,
        managerInfo.platformName,
        postMeetingRecap || managerInfo.postMeetingRecapTemplate
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error marking prospect as proceed:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to mark prospect as proceed',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Mark prospect as "Considering" after meeting (starts nurture sequence)
   */
  async markConsidering(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = MarkConsideringInputSchema.parse(request.body || {});
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate that prospect is in meeting_complete status
      if (prospect.status !== 'meeting_complete') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must be in meeting_complete status to mark as considering',
        });
        return;
      }

      // Update to considering status with timestamp
      const updated = await this.repository.updateStatus(
        id,
        'considering' as ProspectStatus,
        now,
        {
          consideringAt: now,
          meetingRecapBullets: input.meetingRecapBullets || null,
        }
      );

      // Trigger Post-Meeting: Considering email and schedule nurture sequence
      await this.emailTriggers.onMarkedConsidering(
        updated,
        managerInfo.fundName,
        managerInfo.managerName,
        managerInfo.managerTitle,
        input.meetingRecapBullets,
        undefined, // deckLink - could be added to fund settings
        undefined, // ppmPreviewLink - could be added to fund settings
        managerInfo.consideringSupportMessage,
        now
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error marking prospect as considering:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to mark prospect as considering',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Mark prospect as "Not a Fit" after meeting
   */
  async markNotFit(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const input = MarkNotFitInputSchema.parse(request.body || {});
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate that prospect is in meeting_complete status
      if (prospect.status !== 'meeting_complete') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must be in meeting_complete status to mark as not a fit',
        });
        return;
      }

      // Update to not_a_fit status
      const updated = await this.repository.updateStatus(
        id,
        'not_a_fit' as ProspectStatus,
        now,
        { notes: input.reason ? `Not a fit: ${input.reason}` : undefined }
      );

      // Trigger Post-Meeting: Not a Fit email and cancel all pending jobs
      await this.emailTriggers.onMarkedNotFit(
        updated,
        managerInfo.fundName,
        managerInfo.managerName,
        managerInfo.investmentBriefDescriptor
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        console.error('Error marking prospect as not a fit:', error);
        reply.status(500).send({
          success: false,
          error: 'Failed to mark prospect as not a fit',
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  /**
   * Handle "Ready to Invest" click from nurture email
   * Converts prospect from considering to account_invite_sent
   */
  async readyToInvest(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // This can be called without auth (from email link)
      const { id } = request.params as { id: string };
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      // Validate that prospect is in considering status
      if (prospect.status !== 'considering') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must be in considering status to proceed',
        });
        return;
      }

      // Cancel nurture sequence
      await this.emailTriggers.onReadyToInvest(prospect);

      // Update to account_invite_sent status
      const updated = await this.repository.updateStatus(
        id,
        'account_invite_sent' as ProspectStatus,
        now
      );

      // Redirect to account creation page
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      reply.redirect(`${baseUrl}/onboard/${prospect.id}`);
    } catch (error) {
      console.error('Error handling ready to invest:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Mark KYC as not eligible (sends rejection email)
   */
  async markNotEligible(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = request.params as { id: string };
      const now = this.getCurrentTime();

      const prospect = await this.repository.findById(id);
      if (!prospect) {
        reply.status(404).send({ success: false, error: 'Prospect not found' });
        return;
      }

      const managerInfo = await this.getManagerFundInfo(request.user.fundId, request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Validate that prospect is in kyc_submitted status
      if (prospect.status !== 'kyc_submitted' && prospect.status !== 'submitted') {
        reply.status(400).send({
          success: false,
          error: 'Prospect must be in kyc_submitted status to mark as not eligible',
        });
        return;
      }

      // Update to not_eligible status
      const updated = await this.repository.updateStatus(
        id,
        'not_eligible' as ProspectStatus,
        now
      );

      // Trigger KYC Not Eligible email
      await this.emailTriggers.onKYCNotEligible(
        updated,
        managerInfo.fundName,
        managerInfo.accreditationEducationContent
      );

      reply.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error marking prospect as not eligible:', error);
      reply.status(500).send({
        success: false,
        error: 'Failed to mark prospect as not eligible',
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}

export const prospectsController = new ProspectsController();

