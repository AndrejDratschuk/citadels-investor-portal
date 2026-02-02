/**
 * Communications configuration and types
 */

import {
  MessageSquare,
  Mail,
  Video,
  Phone,
  Send,
  Inbox,
} from 'lucide-react';

// ============================================
// Types
// ============================================
export type CommunicationType = 'email' | 'meeting' | 'phone_call';
export type FilterType = 'all' | CommunicationType;
export type DirectionFilter = 'all' | 'sent' | 'received';

export interface Communication {
  id: string;
  type: CommunicationType;
  title: string;
  content: string | null;
  occurredAt: string;
  emailFrom: string | null;
  emailTo: string | null;
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  callDirection: 'inbound' | 'outbound' | null;
  callDurationMinutes: number | null;
  source: string;
  createdAt: string;
  tags: string[];
  investor: {
    id: string;
    name: string;
    email: string;
  };
  deal: {
    id: string;
    name: string;
  } | null;
  managerRead: boolean;
  managerReadAt: string | null;
}

// ============================================
// Filter Options
// ============================================
export interface DirectionOption {
  id: DirectionFilter;
  label: string;
  icon: typeof Send;
}

export const directionOptions: DirectionOption[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'received', label: 'Received', icon: Inbox },
];

export interface FilterOption {
  id: FilterType;
  label: string;
  icon: typeof Mail;
}

export const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'meeting', label: 'Meetings', icon: Video },
  { id: 'phone_call', label: 'Calls', icon: Phone },
];

// ============================================
// Type Configuration
// ============================================
export interface TypeConfig {
  icon: typeof Mail;
  label: string;
  bgColor: string;
  iconColor: string;
}

export const typeConfig: Record<CommunicationType, TypeConfig> = {
  email: {
    icon: Mail,
    label: 'Email',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  meeting: {
    icon: Video,
    label: 'Meeting',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  phone_call: {
    icon: Phone,
    label: 'Phone Call',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Determines if a communication was sent TO the investor (vs received FROM)
 */
export function isSentToInvestor(comm: Communication): boolean {
  if (comm.type === 'email') {
    // If emailTo matches investor email, it was sent TO the investor
    return comm.emailTo?.toLowerCase() === comm.investor.email.toLowerCase();
  }
  if (comm.type === 'phone_call') {
    // Outbound calls are "sent" to investor
    return comm.callDirection === 'outbound';
  }
  // Meetings are shown in both
  return true;
}
