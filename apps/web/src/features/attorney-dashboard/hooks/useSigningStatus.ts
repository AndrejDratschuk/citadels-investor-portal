import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SigningRecord } from '../components';

// Mock data - will be replaced with API call
const mockSigningRecords: SigningRecord[] = [
  {
    id: '1',
    documentId: 'doc-1',
    documentName: 'Subscription Agreement',
    documentType: 'Subscription',
    investorId: 'inv-1',
    investorName: 'John Smith',
    investorEmail: 'john.smith@email.com',
    status: 'signed',
    sentAt: '2024-02-10T14:20:00Z',
    viewedAt: '2024-02-10T16:30:00Z',
    signedAt: '2024-02-11T09:15:00Z',
    reminderCount: 0,
  },
  {
    id: '2',
    documentId: 'doc-2',
    documentName: 'Subscription Agreement',
    documentType: 'Subscription',
    investorId: 'inv-2',
    investorName: 'Sarah Johnson Family Trust',
    investorEmail: 'sarah.johnson@email.com',
    status: 'viewed',
    sentAt: '2024-02-15T10:00:00Z',
    viewedAt: '2024-02-16T08:30:00Z',
    reminderCount: 1,
    lastReminderAt: '2024-02-18T09:00:00Z',
  },
  {
    id: '3',
    documentId: 'doc-3',
    documentName: 'Subscription Agreement',
    documentType: 'Subscription',
    investorId: 'inv-3',
    investorName: 'Acme Holdings LLC',
    investorEmail: 'legal@acmeholdings.com',
    status: 'sent',
    sentAt: '2024-02-20T11:00:00Z',
    reminderCount: 0,
  },
  {
    id: '4',
    documentId: 'doc-4',
    documentName: 'Side Letter Agreement',
    documentType: 'Side Letter',
    investorId: 'inv-4',
    investorName: 'Tech Ventures Corp',
    investorEmail: 'legal@techventures.com',
    status: 'declined',
    sentAt: '2024-02-12T09:00:00Z',
    viewedAt: '2024-02-12T14:00:00Z',
    declinedAt: '2024-02-13T10:30:00Z',
    reminderCount: 0,
  },
  {
    id: '5',
    documentId: 'doc-5',
    documentName: 'Subscription Agreement',
    documentType: 'Subscription',
    investorId: 'inv-5',
    investorName: 'Williams Family Trust',
    investorEmail: 'trust@williamsfamily.com',
    status: 'signed',
    sentAt: '2024-02-08T08:00:00Z',
    viewedAt: '2024-02-08T10:00:00Z',
    signedAt: '2024-02-08T11:30:00Z',
    reminderCount: 0,
  },
  {
    id: '6',
    documentId: 'doc-6',
    documentName: 'Amendment to Operating Agreement',
    documentType: 'Amendment',
    investorId: 'inv-1',
    investorName: 'John Smith',
    investorEmail: 'john.smith@email.com',
    status: 'not_sent',
    reminderCount: 0,
  },
  {
    id: '7',
    documentId: 'doc-7',
    documentName: 'Capital Call Notice',
    documentType: 'Capital Call',
    investorId: 'inv-6',
    investorName: 'Davis Capital Partners',
    investorEmail: 'info@daviscapital.com',
    status: 'sent',
    sentAt: '2024-02-21T14:00:00Z',
    reminderCount: 2,
    lastReminderAt: '2024-02-25T09:00:00Z',
  },
  {
    id: '8',
    documentId: 'doc-8',
    documentName: 'Subscription Agreement',
    documentType: 'Subscription',
    investorId: 'inv-7',
    investorName: 'Robert & Maria Garcia',
    investorEmail: 'garcia.family@email.com',
    status: 'viewed',
    sentAt: '2024-02-19T10:00:00Z',
    viewedAt: '2024-02-20T15:45:00Z',
    reminderCount: 0,
  },
];

async function fetchSigningStatus(): Promise<SigningRecord[]> {
  // TODO: Replace with actual API call
  // const response = await apiClient.get('/documents/signing-status');
  // return response.data;
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockSigningRecords;
}

async function sendForSignature(id: string): Promise<void> {
  // TODO: Replace with actual API call
  // await apiClient.post(`/documents/${id}/send-signature`);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Sent for signature:', id);
}

async function sendReminder(id: string): Promise<void> {
  // TODO: Replace with actual API call
  // await apiClient.post(`/documents/${id}/remind`);
  
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Sent reminder:', id);
}

export function useSigningStatus() {
  return useQuery({
    queryKey: ['signing-status'],
    queryFn: fetchSigningStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSendForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendForSignature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-status'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
    },
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-status'] });
    },
  });
}




