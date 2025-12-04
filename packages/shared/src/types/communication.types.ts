export type CommunicationType = 'email' | 'meeting' | 'phone_call';

export type CommunicationSource = 'manual' | 'email_sync' | 'ai_notetaker';

export type CallDirection = 'inbound' | 'outbound';

export interface Communication {
  id: string;
  investorId: string;
  fundId: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurredAt: string;
  
  // Email-specific
  emailFrom: string | null;
  emailTo: string | null;
  
  // Meeting-specific
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  
  // Phone call specific
  callDirection: CallDirection | null;
  callDurationMinutes: number | null;
  
  // Metadata
  source: CommunicationSource;
  externalId: string | null;
  createdBy: string | null;
  createdAt: string;
}

// Note: CreatePhoneCallInput, CreateEmailInput, CreateMeetingInput are exported from communication.schema.ts


