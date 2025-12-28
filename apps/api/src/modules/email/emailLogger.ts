/**
 * Email Logger Service
 * 
 * Logs all email sends to the email_logs table for automation tracking and auditing.
 * This service should be called after every email send operation.
 */

import { supabaseAdmin } from '../../common/database/supabase';

export type EmailStatus = 'sent' | 'delivered' | 'opened' | 'failed';

export type AutomationType =
  | 'document_approval'
  | 'document_rejection'
  | 'documents_approved_docusign'
  | 'capital_call_request'
  | 'capital_call_reminder'
  | 'wire_confirmation'
  | 'wire_issue'
  | 'welcome_investor'
  | 'account_invite'
  | 'verification_code'
  | 'kyc_invite'
  | 'kyc_reminder'
  | 'meeting_invite'
  | 'onboarding_reminder'
  | 'password_reset'
  | 'manual_send';

export type TriggerEvent =
  | 'manager_approved_document'
  | 'manager_rejected_document'
  | 'all_documents_approved'
  | 'manager_created_capital_call'
  | 'manager_confirmed_wire'
  | 'manager_reported_wire_issue'
  | 'prospect_converted_to_investor'
  | 'manager_sent_account_invite'
  | 'user_requested_verification'
  | 'manager_sent_kyc_invite'
  | 'scheduled_kyc_reminder'
  | 'kyc_approved'
  | 'scheduled_onboarding_reminder'
  | 'user_requested_password_reset'
  | 'manual_trigger';

export type RelatedEntityType =
  | 'document'
  | 'capital_call'
  | 'capital_call_item'
  | 'investor'
  | 'prospect'
  | 'deal'
  | 'fund';

export interface EmailLogInput {
  fundId: string | null;
  investorId?: string | null;
  emailType: string;
  automationType: AutomationType;
  triggerEvent: TriggerEvent;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  messageId?: string | null;
  errorMessage?: string | null;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface EmailLogRecord {
  id: string;
  fundId: string | null;
  investorId: string | null;
  emailType: string;
  automationType: string | null;
  triggerEvent: string | null;
  recipientEmail: string;
  subject: string;
  status: EmailStatus;
  messageId: string | null;
  errorMessage: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, unknown>;
  sentAt: string;
}

export interface EmailLogFilters {
  automationType?: AutomationType;
  status?: EmailStatus;
  startDate?: Date;
  endDate?: Date;
  investorId?: string;
  limit?: number;
  offset?: number;
}

class EmailLogger {
  /**
   * Log an email send to the database
   */
  async log(input: EmailLogInput): Promise<EmailLogRecord | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('email_logs')
        .insert({
          fund_id: input.fundId,
          investor_id: input.investorId || null,
          email_type: input.emailType,
          automation_type: input.automationType,
          trigger_event: input.triggerEvent,
          recipient_email: input.recipientEmail,
          subject: input.subject,
          status: input.status,
          message_id: input.messageId || null,
          error_message: input.errorMessage || null,
          related_entity_type: input.relatedEntityType || null,
          related_entity_id: input.relatedEntityId || null,
          metadata: input.metadata || {},
          sent_at: input.timestamp.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[EmailLogger] Failed to log email:', error);
        return null;
      }

      return this.formatRecord(data);
    } catch (err) {
      console.error('[EmailLogger] Error logging email:', err);
      return null;
    }
  }

  /**
   * Get email logs for a fund with optional filters
   */
  async getByFundId(fundId: string, filters?: EmailLogFilters): Promise<EmailLogRecord[]> {
    let query = supabaseAdmin
      .from('email_logs')
      .select('*')
      .eq('fund_id', fundId)
      .order('sent_at', { ascending: false });

    if (filters?.automationType) {
      query = query.eq('automation_type', filters.automationType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.investorId) {
      query = query.eq('investor_id', filters.investorId);
    }

    if (filters?.startDate) {
      query = query.gte('sent_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('sent_at', filters.endDate.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[EmailLogger] Error fetching logs:', error);
      return [];
    }

    return (data || []).map(this.formatRecord);
  }

  /**
   * Get count of email logs for a fund
   */
  async getCountByFundId(fundId: string, filters?: EmailLogFilters): Promise<number> {
    let query = supabaseAdmin
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('fund_id', fundId);

    if (filters?.automationType) {
      query = query.eq('automation_type', filters.automationType);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('sent_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('sent_at', filters.endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      console.error('[EmailLogger] Error fetching count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get a single log entry by ID
   */
  async getById(id: string): Promise<EmailLogRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[EmailLogger] Error fetching log by id:', error);
      return null;
    }

    return this.formatRecord(data);
  }

  /**
   * Update the status of an email log (e.g., when delivery confirmation received)
   */
  async updateStatus(id: string, status: EmailStatus): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('email_logs')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[EmailLogger] Error updating status:', error);
      return false;
    }

    return true;
  }

  private formatRecord(data: Record<string, unknown>): EmailLogRecord {
    return {
      id: data.id as string,
      fundId: data.fund_id as string | null,
      investorId: data.investor_id as string | null,
      emailType: data.email_type as string,
      automationType: data.automation_type as string | null,
      triggerEvent: data.trigger_event as string | null,
      recipientEmail: data.recipient_email as string,
      subject: data.subject as string,
      status: data.status as EmailStatus,
      messageId: data.message_id as string | null,
      errorMessage: data.error_message as string | null,
      relatedEntityType: data.related_entity_type as string | null,
      relatedEntityId: data.related_entity_id as string | null,
      metadata: (data.metadata as Record<string, unknown>) || {},
      sentAt: data.sent_at as string,
    };
  }
}

export const emailLogger = new EmailLogger();

