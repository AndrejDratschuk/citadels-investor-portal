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

export class CommunicationsService {
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
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create phone call log: ${error.message}`);
    }

    return mapDbToCommunication(data as DbCommunication);
  }

  async createEmail(
    input: CreateEmailInput,
    fundId: string,
    userId?: string
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
        source: 'email_sync',
        external_id: input.externalId || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create email log: ${error.message}`);
    }

    return mapDbToCommunication(data as DbCommunication);
  }

  async createMeeting(
    input: CreateMeetingInput,
    fundId: string,
    userId?: string
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
        source: 'ai_notetaker',
        external_id: input.externalId || null,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meeting log: ${error.message}`);
    }

    return mapDbToCommunication(data as DbCommunication);
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


