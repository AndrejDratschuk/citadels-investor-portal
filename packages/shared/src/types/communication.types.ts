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

export interface CreatePhoneCallInput {
  investorId: string;
  title: string;
  content?: string;
  occurredAt: string;
  callDirection: CallDirection;
  callDurationMinutes?: number;
}

export interface CreateEmailInput {
  investorId: string;
  title: string;
  content?: string;
  occurredAt: string;
  emailFrom: string;
  emailTo: string;
  externalId?: string;
}

export interface CreateMeetingInput {
  investorId: string;
  title: string;
  content?: string;
  occurredAt: string;
  meetingAttendees?: string[];
  meetingDurationMinutes?: number;
  externalId?: string;
}

