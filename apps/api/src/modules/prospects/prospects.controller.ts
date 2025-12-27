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
} from '@flowveda/shared';
import type { ProspectStatus } from '@flowveda/shared';

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
   * Get manager's fund info from their user record
   */
  private async getManagerFundInfo(userId: string): Promise<{
    fundId: string;
    fundName: string;
    managerName: string;
    managerEmail: string;
    calendlyUrl?: string;
  } | null> {
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('fund_id, first_name, last_name, email')
      .eq('id', userId)
      .single();

    if (managerError || !manager?.fund_id) {
      return null;
    }

    const { data: fund } = await supabaseAdmin
      .from('funds')
      .select('name, calendly_url')
      .eq('id', manager.fund_id)
      .single();

    return {
      fundId: manager.fund_id,
      fundName: fund?.name || 'Fund',
      managerName: `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || 'Fund Manager',
      managerEmail: manager.email,
      calendlyUrl: fund?.calendly_url,
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);

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
        throw error;
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

      const managerInfo = await this.getManagerFundInfo(request.user.id);
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
        throw error;
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

      const managerInfo = await this.getManagerFundInfo(request.user.id);
      if (!managerInfo) {
        reply.status(404).send({ success: false, error: 'Fund not found' });
        return;
      }

      const stats = await this.repository.getStats(managerInfo.fundId);

      reply.send({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      reply.send({ success: true, data: prospect });
    } catch (error) {
      console.error('Error fetching prospect:', error);
      throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
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
        managerInfo.managerEmail
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
        throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
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
        throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
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
        managerInfo.managerEmail
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
        throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
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
        throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      const updated = await this.repository.updateNotes(id, notes, now);

      reply.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating notes:', error);
      throw error;
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
      const managerInfo = await this.getManagerFundInfo(request.user.id);
      if (!managerInfo || managerInfo.fundId !== prospect.fundId) {
        reply.status(403).send({ success: false, error: 'Access denied' });
        return;
      }

      // Send appropriate reminder
      if (type === 'kyc' && prospect.status === 'kyc_sent') {
        await this.emailTriggers.sendKYCReminder(prospect, managerInfo.fundName);
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
      throw error;
    }
  }
}

export const prospectsController = new ProspectsController();

