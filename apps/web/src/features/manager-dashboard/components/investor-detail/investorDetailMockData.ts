/**
 * Mock data for InvestorDetail component
 * TODO: Replace with real API calls when available
 */

import type { Communication } from '@altsui/shared';

export interface MockDocument {
  id: string;
  name: string;
  type: string;
  signingStatus: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface MockCapitalCall {
  id: string;
  dealName: string;
  amountDue: number;
  amountReceived: number;
  status: string;
  deadline: string;
}

export interface MockActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export const mockDocuments: MockDocument[] = [
  {
    id: '1',
    name: 'Subscription Agreement',
    type: 'subscription',
    signingStatus: 'signed',
    signedAt: '2023-06-10',
    createdAt: '2023-06-05',
  },
  {
    id: '2',
    name: 'Private Placement Memorandum',
    type: 'ppm',
    signingStatus: 'signed',
    signedAt: '2023-06-08',
    createdAt: '2023-06-05',
  },
  {
    id: '3',
    name: 'K-1 Tax Document 2023',
    type: 'k1',
    signingStatus: null,
    signedAt: null,
    createdAt: '2024-01-15',
  },
];

export const mockCapitalCalls: MockCapitalCall[] = [
  {
    id: '1',
    dealName: 'Riverside Apartments',
    amountDue: 96000,
    amountReceived: 96000,
    status: 'complete',
    deadline: '2023-07-15',
  },
  {
    id: '2',
    dealName: 'Downtown Office Tower',
    amountDue: 43000,
    amountReceived: 43000,
    status: 'complete',
    deadline: '2024-02-01',
  },
  {
    id: '3',
    dealName: 'Eastside Industrial',
    amountDue: 62000,
    amountReceived: 31000,
    status: 'partial',
    deadline: '2024-03-15',
  },
];

export const mockActivity: MockActivity[] = [
  {
    id: '1',
    type: 'wire_received',
    description: 'Wire received for Eastside Industrial - $31,000',
    timestamp: '2024-02-28T14:30:00Z',
  },
  {
    id: '2',
    type: 'document_signed',
    description: 'Signed K-1 Tax Document 2023',
    timestamp: '2024-01-20T10:15:00Z',
  },
  {
    id: '3',
    type: 'capital_call',
    description: 'Capital call sent for Eastside Industrial',
    timestamp: '2024-02-15T09:00:00Z',
  },
];

export const mockCommunications: Communication[] = [
  {
    id: '1',
    investorId: '1',
    fundId: '1',
    type: 'email',
    title: 'Q4 Distribution Notice',
    content: 'Please find attached the Q4 distribution details for your investment...',
    occurredAt: '2024-02-15T10:30:00Z',
    emailFrom: 'distributions@fund.com',
    emailTo: 'john.smith@example.com',
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: null,
    callDurationMinutes: null,
    source: 'email_sync',
    externalId: null,
    createdBy: null,
    createdAt: '2024-02-15T10:30:00Z',
  },
  {
    id: '2',
    investorId: '1',
    fundId: '1',
    type: 'meeting',
    title: 'Portfolio Review Meeting',
    content: 'Discussed current portfolio performance, upcoming capital calls, and investment strategy for 2024. John expressed interest in increasing commitment.',
    occurredAt: '2024-02-10T14:00:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: ['John Smith', 'Sarah Manager'],
    meetingDurationMinutes: 45,
    callDirection: null,
    callDurationMinutes: null,
    source: 'ai_notetaker',
    externalId: null,
    createdBy: null,
    createdAt: '2024-02-10T15:00:00Z',
  },
  {
    id: '3',
    investorId: '1',
    fundId: '1',
    type: 'phone_call',
    title: 'Follow-up on wire transfer',
    content: 'Called to confirm wire instructions for upcoming capital call. John confirmed he will send by Friday.',
    occurredAt: '2024-02-08T11:15:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: 'outbound',
    callDurationMinutes: 12,
    source: 'manual',
    externalId: null,
    createdBy: 'user-1',
    createdAt: '2024-02-08T11:30:00Z',
  },
  {
    id: '4',
    investorId: '1',
    fundId: '1',
    type: 'phone_call',
    title: 'Question about K-1 documents',
    content: 'John called with questions about his K-1 tax documents. Directed him to our accountant for detailed tax guidance.',
    occurredAt: '2024-01-25T09:45:00Z',
    emailFrom: null,
    emailTo: null,
    meetingAttendees: null,
    meetingDurationMinutes: null,
    callDirection: 'inbound',
    callDurationMinutes: 8,
    source: 'manual',
    externalId: null,
    createdBy: 'user-1',
    createdAt: '2024-01-25T10:00:00Z',
  },
];
