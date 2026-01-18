/**
 * Prospects Repository (Adapter Layer)
 * Handles all Supabase data access for prospects/pipeline
 * No business logic here - only database operations
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  Prospect,
  ProspectFilters,
  PipelineMetrics,
  CreateProspectData,
  CreateInvestorFromProspectData,
} from '@altsui/shared';
import type { ProspectStatus, ProspectSource } from '@altsui/shared';

// ============================================
// Database Row Types (snake_case)
// ============================================
interface ProspectRow {
  id: string;
  fund_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  investor_category: string | null;
  investor_type: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  entity_legal_name: string | null;
  country_of_formation: string | null;
  state_of_formation: string | null;
  authorized_signer_first_name: string | null;
  authorized_signer_last_name: string | null;
  authorized_signer_title: string | null;
  accreditation_bases: string[] | null;
  indicative_commitment: number | null;
  timeline: string | null;
  investment_goals: string[] | null;
  likelihood: string | null;
  questions_for_manager: string | null;
  preferred_contact: string | null;
  consent_given: boolean | null;
  kyc_link_token: string | null;
  calendly_event_url: string | null;
  sent_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  meeting_scheduled_at: string | null;
  meeting_completed_at: string | null;
  onboarding_started_at: string | null;
  onboarding_submitted_at: string | null;
  documents_approved_at: string | null;
  documents_rejected_at: string | null;
  document_rejection_reason: string | null;
  docusign_envelope_id: string | null;
  docusign_sent_at: string | null;
  docusign_signed_at: string | null;
  converted_to_investor: boolean | null;
  converted_at: string | null;
  investor_id: string | null;
}

interface FundRow {
  id: string;
  name: string;
}

// ============================================
// Repository Class
// ============================================
export class ProspectsRepository {
  
  // ========== Core CRUD Operations ==========

  async findById(id: string): Promise<Prospect | null> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  async findByToken(token: string): Promise<Prospect | null> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .eq('kyc_link_token', token)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  async findByEmail(email: string, fundId: string): Promise<Prospect | null> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .eq('email', email)
      .eq('fund_id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  async findByFundId(
    fundId: string,
    filters?: ProspectFilters
  ): Promise<Prospect[]> {
    let query = supabaseAdmin
      .from('kyc_applications')
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .eq('fund_id', fundId)
      .neq('status', 'draft'); // Exclude drafts from pipeline view

    // Apply status filter
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Apply source filter
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    // Apply search filter
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},entity_legal_name.ilike.${searchTerm}`
      );
    }

    // Apply date range filters
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prospects:', error);
      throw new Error('Failed to fetch prospects');
    }

    return data.map((row) => this.formatProspect(row, row.funds as FundRow));
  }

  async create(prospectData: CreateProspectData): Promise<Prospect> {
    const row = {
      id: prospectData.id,
      fund_id: prospectData.fundId,
      email: prospectData.email,
      first_name: prospectData.firstName,
      last_name: prospectData.lastName,
      phone: prospectData.phone,
      status: prospectData.status,
      source: prospectData.source,
      sent_by: prospectData.sentBy,
      kyc_link_token: prospectData.kycLinkToken,
      notes: prospectData.notes,
      created_at: prospectData.createdAt.toISOString(),
      updated_at: prospectData.updatedAt.toISOString(),
      investor_category: 'individual' as const, // Default
      investor_type: 'hnw', // Default
      consent_given: false,
    };

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .insert(row)
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating prospect:', error);
      throw new Error(`Failed to create prospect: ${error.message}`);
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  async updateStatus(
    id: string,
    status: ProspectStatus,
    updatedAt: Date,
    additionalFields?: Partial<{
      meetingCompletedAt: Date;
      consideringAt: Date;
      meetingRecapBullets: string | null;
      onboardingStartedAt: Date;
      onboardingSubmittedAt: Date;
      documentsApprovedAt: Date;
      documentsRejectedAt: Date;
      documentRejectionReason: string;
      notes: string;
      docusignEnvelopeId: string;
      docusignSentAt: Date;
      docusignSignedAt: Date;
      convertedToInvestor: boolean;
      convertedAt: Date;
      investorId: string;
    }>
  ): Promise<Prospect> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: updatedAt.toISOString(),
    };

    // Map additional fields to snake_case
    if (additionalFields?.meetingCompletedAt) {
      updateData.meeting_completed_at = additionalFields.meetingCompletedAt.toISOString();
    }
    if (additionalFields?.consideringAt) {
      updateData.considering_at = additionalFields.consideringAt.toISOString();
    }
    if (additionalFields?.meetingRecapBullets !== undefined) {
      updateData.meeting_recap_bullets = additionalFields.meetingRecapBullets;
    }
    if (additionalFields?.onboardingStartedAt) {
      updateData.onboarding_started_at = additionalFields.onboardingStartedAt.toISOString();
    }
    if (additionalFields?.onboardingSubmittedAt) {
      updateData.onboarding_submitted_at = additionalFields.onboardingSubmittedAt.toISOString();
    }
    if (additionalFields?.documentsApprovedAt) {
      updateData.documents_approved_at = additionalFields.documentsApprovedAt.toISOString();
    }
    if (additionalFields?.documentsRejectedAt) {
      updateData.documents_rejected_at = additionalFields.documentsRejectedAt.toISOString();
    }
    if (additionalFields?.documentRejectionReason) {
      updateData.document_rejection_reason = additionalFields.documentRejectionReason;
    }
    if (additionalFields?.notes) {
      updateData.notes = additionalFields.notes;
    }
    if (additionalFields?.docusignEnvelopeId) {
      updateData.docusign_envelope_id = additionalFields.docusignEnvelopeId;
    }
    if (additionalFields?.docusignSentAt) {
      updateData.docusign_sent_at = additionalFields.docusignSentAt.toISOString();
    }
    if (additionalFields?.docusignSignedAt) {
      updateData.docusign_signed_at = additionalFields.docusignSignedAt.toISOString();
    }
    if (additionalFields?.convertedToInvestor !== undefined) {
      updateData.converted_to_investor = additionalFields.convertedToInvestor;
    }
    if (additionalFields?.convertedAt) {
      updateData.converted_at = additionalFields.convertedAt.toISOString();
    }
    if (additionalFields?.investorId) {
      updateData.investor_id = additionalFields.investorId;
    }

    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating prospect status:', error);
      throw new Error('Failed to update prospect status');
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  async updateNotes(id: string, notes: string, updatedAt: Date): Promise<Prospect> {
    const { data, error } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        notes,
        updated_at: updatedAt.toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        funds:fund_id (id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating prospect notes:', error);
      throw new Error('Failed to update prospect notes');
    }

    return this.formatProspect(data, data.funds as FundRow);
  }

  // ========== Stats & Metrics ==========

  async getStats(fundId: string): Promise<PipelineMetrics> {
    const { data, error } = await supabaseAdmin.rpc('get_pipeline_stats', {
      p_fund_id: fundId,
    });

    if (error) {
      console.error('Error fetching pipeline stats:', error);
      // Return default metrics if RPC fails
      return this.calculateStatsManually(fundId);
    }

    return {
      totalProspects: data.total_prospects || 0,
      kycSent: data.kyc_sent || 0,
      kycSubmitted: data.kyc_submitted || 0,
      kycSubmittedThisWeek: 0, // Calculated separately
      preQualified: data.pre_qualified || 0,
      meetingsScheduled: data.meetings_scheduled || 0,
      meetingsCompleted: data.meetings_completed || 0,
      considering: data.considering || 0,
      onboardingInProgress: data.onboarding_in_progress || 0,
      documentsPending: data.documents_pending || 0,
      documentsApproved: data.documents_approved || 0,
      docusignPending: data.docusign_pending || 0,
      readyToConvert: data.ready_to_convert || 0,
      convertedThisMonth: data.converted || 0,
    };
  }

  private async calculateStatsManually(fundId: string): Promise<PipelineMetrics> {
    const prospects = await this.findByFundId(fundId);
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      totalProspects: prospects.length,
      kycSent: prospects.filter(p => p.status === 'kyc_sent').length,
      kycSubmitted: prospects.filter(p => ['submitted', 'kyc_submitted'].includes(p.status)).length,
      kycSubmittedThisWeek: prospects.filter(p => 
        ['submitted', 'kyc_submitted'].includes(p.status) && 
        new Date(p.createdAt) >= oneWeekAgo
      ).length,
      preQualified: prospects.filter(p => p.status === 'pre_qualified').length,
      meetingsScheduled: prospects.filter(p => p.status === 'meeting_scheduled').length,
      meetingsCompleted: prospects.filter(p => p.status === 'meeting_complete').length,
      considering: prospects.filter(p => p.status === 'considering').length,
      onboardingInProgress: prospects.filter(p => 
        ['account_invite_sent', 'account_created', 'onboarding_submitted'].includes(p.status)
      ).length,
      documentsPending: prospects.filter(p => p.status === 'documents_pending').length,
      documentsApproved: prospects.filter(p => p.status === 'documents_approved').length,
      docusignPending: prospects.filter(p => p.status === 'docusign_sent').length,
      readyToConvert: prospects.filter(p => p.status === 'docusign_signed').length,
      convertedThisMonth: prospects.filter(p => 
        p.status === 'converted' && 
        p.convertedAt && 
        new Date(p.convertedAt) >= oneMonthAgo
      ).length,
    };
  }

  // ========== Investor Conversion ==========

  async createInvestorFromProspect(
    investorData: CreateInvestorFromProspectData
  ): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .insert({
        id: investorData.id,
        fund_id: investorData.fundId,
        email: investorData.email,
        first_name: investorData.firstName,
        last_name: investorData.lastName,
        phone: investorData.phone,
        status: 'active',
        prospect_id: investorData.prospectId,
        onboarded_at: investorData.onboardedAt.toISOString(),
        entity_type: investorData.entityType,
        entity_name: investorData.entityName,
        commitment_amount: investorData.commitmentAmount,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating investor from prospect:', error);
      throw new Error('Failed to create investor');
    }

    return data.id;
  }

  // ========== Fund Info Helper ==========

  async getFundById(fundId: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await supabaseAdmin
      .from('funds')
      .select('id, name')
      .eq('id', fundId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Auto-transition prospect to documents_pending when validation documents are uploaded
   * Only transitions if current status is onboarding_submitted or account_created
   */
  async transitionToDocumentsPending(
    investorId: string,
    timestamp: Date
  ): Promise<{ updated: boolean; prospectId?: string }> {
    // Find the prospect linked to this investor
    const { data: prospect, error: findError } = await supabaseAdmin
      .from('kyc_applications')
      .select('id, status')
      .eq('investor_id', investorId)
      .single();

    if (findError || !prospect) {
      return { updated: false };
    }

    // Only transition from specific statuses
    const allowedStatuses = ['onboarding_submitted', 'account_created'];
    if (!allowedStatuses.includes(prospect.status)) {
      return { updated: false };
    }

    // Update to documents_pending
    const { error: updateError } = await supabaseAdmin
      .from('kyc_applications')
      .update({
        status: 'documents_pending',
        updated_at: timestamp.toISOString(),
      })
      .eq('id', prospect.id);

    if (updateError) {
      console.error('[ProspectsRepository] Error transitioning to documents_pending:', updateError);
      return { updated: false };
    }

    console.log(`[ProspectsRepository] Auto-transitioned prospect ${prospect.id} to documents_pending`);
    return { updated: true, prospectId: prospect.id };
  }

  // ========== Formatting Helper ==========

  private formatProspect(row: ProspectRow, fund: FundRow | null): Prospect {
    return {
      id: row.id,
      fundId: row.fund_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      status: row.status as ProspectStatus,
      source: (row.source || 'website') as ProspectSource,
      investorCategory: row.investor_category as 'individual' | 'entity' | null,
      investorType: row.investor_type,
      country: row.country,
      state: row.state,
      city: row.city,
      entityLegalName: row.entity_legal_name,
      countryOfFormation: row.country_of_formation,
      stateOfFormation: row.state_of_formation,
      authorizedSignerFirstName: row.authorized_signer_first_name,
      authorizedSignerLastName: row.authorized_signer_last_name,
      authorizedSignerTitle: row.authorized_signer_title,
      accreditationBases: row.accreditation_bases || [],
      indicativeCommitment: row.indicative_commitment,
      timeline: row.timeline as Prospect['timeline'],
      investmentGoals: row.investment_goals || [],
      likelihood: row.likelihood as Prospect['likelihood'],
      questionsForManager: row.questions_for_manager,
      preferredContact: row.preferred_contact as Prospect['preferredContact'],
      consentGiven: row.consent_given || false,
      kycLinkToken: row.kyc_link_token,
      calendlyEventUrl: row.calendly_event_url,
      sentBy: row.sent_by,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      meetingScheduledAt: row.meeting_scheduled_at,
      meetingCompletedAt: row.meeting_completed_at,
      consideringAt: (row as unknown as Record<string, unknown>).considering_at as string | null,
      onboardingStartedAt: row.onboarding_started_at,
      onboardingSubmittedAt: row.onboarding_submitted_at,
      documentsApprovedAt: row.documents_approved_at,
      documentsRejectedAt: row.documents_rejected_at,
      documentRejectionReason: row.document_rejection_reason,
      meetingRecapBullets: (row as unknown as Record<string, unknown>).meeting_recap_bullets as string | null,
      docusignEnvelopeId: row.docusign_envelope_id,
      docusignSentAt: row.docusign_sent_at,
      docusignSignedAt: row.docusign_signed_at,
      convertedToInvestor: row.converted_to_investor || false,
      convertedAt: row.converted_at,
      investorId: row.investor_id,
      fundName: fund?.name,
      fundCode: row.fund_id, // Using fund_id as code for now
    };
  }
}

export const prospectsRepository = new ProspectsRepository();

