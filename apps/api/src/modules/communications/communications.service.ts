import { supabaseAdmin } from '../../common/database/supabase';
import {
  Communication,
  CommunicationType,
  CreatePhoneCallInput,
  CreateEmailInput,
  CreateMeetingInput,
} from '@flowveda/shared';

interface DbCommunication {
  id: string;
  investor_id: string;
  fund_id: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurred_at: string;
  email_from: string | null;
  email_to: string | null;
  meeting_attendees: string[] | null;
  meeting_duration_minutes: number | null;
  call_direction: 'inbound' | 'outbound' | null;
  call_duration_minutes: number | null;
  source: 'manual' | 'email_sync' | 'ai_notetaker';
  external_id: string | null;
  created_by: string | null;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  manager_read: boolean;
  manager_read_at: string | null;
}

function mapDbToCommunication(db: DbCommunication): Communication {
  return {
    id: db.id,
    investorId: db.investor_id,
    fundId: db.fund_id,
    type: db.type,
    title: db.title,
    content: db.content,
    occurredAt: db.occurred_at,
    emailFrom: db.email_from,
    emailTo: db.email_to,
    meetingAttendees: db.meeting_attendees,
    meetingDurationMinutes: db.meeting_duration_minutes,
    callDirection: db.call_direction,
    callDurationMinutes: db.call_duration_minutes,
    source: db.source,
    externalId: db.external_id,
    createdBy: db.created_by,
    createdAt: db.created_at,
  };
}

export interface CommunicationWithInvestor extends Communication {
  investor: {
    id: string;
    name: string;
    email: string;
  };
  deal: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  managerRead: boolean;
  managerReadAt: string | null;
}

export class CommunicationsService {
  /**
   * Get all communications for a fund (manager view)
   */
  async getAllByFundId(fundId: string): Promise<CommunicationWithInvestor[]> {
    console.log('[getAllByFundId] Querying for fund_id:', fundId);
    
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .select(`
        *,
        investor:investors (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('fund_id', fundId)
      .order('occurred_at', { ascending: false });

    console.log('[getAllByFundId] Query result - data:', data?.length || 0, 'error:', error?.message || 'none');

    if (error) {
      console.error('[getAllByFundId] Error fetching fund communications:', error);
      throw new Error(`Failed to fetch communications: ${error.message}`);
    }

    console.log('[getAllByFundId] Returning', (data || []).length, 'communications');
    return (data || []).map((item: any) => ({
      ...mapDbToCommunication(item),
      investor: item.investor ? {
        id: item.investor.id,
        name: `${item.investor.first_name} ${item.investor.last_name}`,
        email: item.investor.email,
      } : { id: '', name: 'Unknown', email: '' },
      deal: null, // Deal join removed due to missing FK relationship
      tags: item.tags || [],
      managerRead: item.manager_read ?? true, // For manager view, use manager_read status
      managerReadAt: item.manager_read_at || null,
    }));
  }

  async getByInvestorId(
    investorId: string,
    type?: CommunicationType
  ): Promise<Communication[]> {
    let query = supabaseAdmin
      .from('investor_communications')
      .select('*')
      .eq('investor_id', investorId)
      .order('occurred_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch communications: ${error.message}`);
    }

    return (data as DbCommunication[]).map(mapDbToCommunication);
  }

  async createPhoneCall(
    input: CreatePhoneCallInput,
    fundId: string,
    userId: string
  ): Promise<Communication> {
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .insert({
        investor_id: input.investorId,
        fund_id: fundId,
        type: 'phone_call',
        title: input.title,
        content: input.content || null,
        occurred_at: input.occurredAt,
        call_direction: input.callDirection,
        call_duration_minutes: input.callDurationMinutes || null,
        source: 'manual',
        created_by: userId,
        is_read: false, // Unread for the investor
        manager_read: true, // Manager created this, so they already know about it
        manager_read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create phone call log: ${error.message}`);
    }

    // Create notification for investor
    await this.createInvestorNotification(input.investorId, fundId, 'phone_call', input.title, data.id);

    return mapDbToCommunication(data as DbCommunication);
  }

  async createEmail(
    input: CreateEmailInput,
    fundId: string,
    userId?: string,
    source: 'manual' | 'email_sync' = 'manual'
  ): Promise<Communication> {
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .insert({
        investor_id: input.investorId,
        fund_id: fundId,
        type: 'email',
        title: input.title,
        content: input.content || null,
        occurred_at: input.occurredAt,
        email_from: input.emailFrom,
        email_to: input.emailTo,
        source: source,
        external_id: input.externalId || null,
        created_by: userId || null,
        is_read: false, // Unread for the investor
        manager_read: true, // Manager created this, so they already know about it
        manager_read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create email log: ${error.message}`);
    }

    // Create notification for investor
    await this.createInvestorNotification(input.investorId, fundId, 'email', input.title, data.id);

    return mapDbToCommunication(data as DbCommunication);
  }

  async createMeeting(
    input: CreateMeetingInput,
    fundId: string,
    userId?: string,
    source: 'manual' | 'ai_notetaker' = 'manual'
  ): Promise<Communication> {
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .insert({
        investor_id: input.investorId,
        fund_id: fundId,
        type: 'meeting',
        title: input.title,
        content: input.content || null,
        occurred_at: input.occurredAt,
        meeting_attendees: input.meetingAttendees || null,
        meeting_duration_minutes: input.meetingDurationMinutes || null,
        source: source,
        external_id: input.externalId || null,
        created_by: userId || null,
        is_read: false, // Unread for the investor
        manager_read: true, // Manager created this, so they already know about it
        manager_read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meeting log: ${error.message}`);
    }

    // Create notification for investor
    await this.createInvestorNotification(input.investorId, fundId, 'meeting', input.title, data.id);

    return mapDbToCommunication(data as DbCommunication);
  }

  /**
   * Create a notification for an investor when a new communication is logged
   */
  private async createInvestorNotification(
    investorId: string,
    fundId: string,
    type: CommunicationType,
    title: string,
    communicationId: string
  ): Promise<void> {
    try {
      // Get investor's user_id
      const { data: investor } = await supabaseAdmin
        .from('investors')
        .select('user_id')
        .eq('id', investorId)
        .single();

      if (!investor?.user_id) {
        console.log('[createInvestorNotification] Investor has no user_id, skipping notification');
        return;
      }

      const typeLabel = type === 'phone_call' ? 'Phone Call' : type === 'email' ? 'Email' : 'Meeting';
      
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: investor.user_id,
          fund_id: fundId,
          type: 'new_communication',
          title: `New ${typeLabel} from Fund Manager`,
          message: title,
          related_entity_type: 'communication',
          related_entity_id: communicationId,
          metadata: {
            communication_type: type,
          },
        });
      
      console.log('[createInvestorNotification] Notification created for investor user:', investor.user_id);
    } catch (error) {
      // Don't fail the whole operation if notification fails
      console.error('[createInvestorNotification] Failed to create notification:', error);
    }
  }

  /**
   * Mark a communication as read by the manager
   */
  async markAsReadForManager(communicationId: string, fundId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('investor_communications')
      .update({
        manager_read: true,
        manager_read_at: new Date().toISOString(),
      })
      .eq('id', communicationId)
      .eq('fund_id', fundId); // Ensure manager can only update their fund's communications

    if (error) {
      console.error('[markAsReadForManager] Error:', error);
      throw new Error(`Failed to mark communication as read: ${error.message}`);
    }
    
    console.log('[markAsReadForManager] Marked communication as read:', communicationId);
  }

  /**
   * Get count of unread communications for a fund (manager view)
   */
  async getUnreadCountForManager(fundId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('investor_communications')
      .select('*', { count: 'exact', head: true })
      .eq('fund_id', fundId)
      .eq('manager_read', false);

    if (error) {
      console.error('[getUnreadCountForManager] Error:', error);
      return 0;
    }

    return count || 0;
  }

  async delete(communicationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('investor_communications')
      .delete()
      .eq('id', communicationId);

    if (error) {
      throw new Error(`Failed to delete communication: ${error.message}`);
    }
  }
}


