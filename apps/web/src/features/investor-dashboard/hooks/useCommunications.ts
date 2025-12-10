import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunicationPreviewItem, CommunicationType } from '../components/CommunicationsPreview';

export interface InvestorCommunication {
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
  isRead?: boolean;
  tags?: string[];
  deal?: {
    id: string;
    name: string;
  } | null;
}

// Transform API response to preview format
function transformToPreview(communication: InvestorCommunication): CommunicationPreviewItem {
  let from = 'Fund Manager';
  
  if (communication.type === 'email' && communication.emailFrom) {
    from = communication.emailFrom;
  } else if (communication.type === 'meeting' && communication.meetingAttendees?.length) {
    from = communication.meetingAttendees[0];
  }

  return {
    id: communication.id,
    type: communication.type,
    subject: communication.title,
    from,
    date: communication.occurredAt,
    preview: communication.content?.substring(0, 100) || undefined,
    isRead: communication.isRead ?? true,
    tags: communication.tags,
    dealName: communication.deal?.name,
  };
}

// Mock data for development
function getMockCommunications(): InvestorCommunication[] {
  const now = new Date();
  return [
    {
      id: 'comm-1',
      type: 'email',
      title: 'Q4 2024 Fund Performance Update',
      content: 'Dear Investor, we are pleased to share our Q4 2024 performance results. The fund achieved a 12.3% return this quarter...',
      occurredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: 'fund.manager@citadel.com',
      emailTo: null,
      meetingAttendees: null,
      meetingDurationMinutes: null,
      callDirection: null,
      callDurationMinutes: null,
      source: 'email_sync',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      tags: ['quarterly-report', 'performance'],
    },
    {
      id: 'comm-2',
      type: 'email',
      title: 'Capital Call Notice - Downtown Office Tower',
      content: 'This notice is to inform you of an upcoming capital call for the Downtown Office Tower acquisition...',
      occurredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: 'capital.calls@citadel.com',
      emailTo: null,
      meetingAttendees: null,
      meetingDurationMinutes: null,
      callDirection: null,
      callDurationMinutes: null,
      source: 'email_sync',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      tags: ['capital-call'],
      deal: { id: '1', name: 'Downtown Office Tower' },
    },
    {
      id: 'comm-3',
      type: 'meeting',
      title: 'Annual Investor Meeting Recording',
      content: 'Thank you for attending our annual investor meeting. Please find the recording and presentation materials attached.',
      occurredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: null,
      emailTo: null,
      meetingAttendees: ['John Smith - Fund Manager', 'Sarah Johnson - CFO'],
      meetingDurationMinutes: 90,
      callDirection: null,
      callDurationMinutes: null,
      source: 'manual',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      tags: ['meeting', 'annual'],
    },
    {
      id: 'comm-4',
      type: 'email',
      title: 'Distribution Notice - Riverside Apartments',
      content: 'We are pleased to announce a distribution from the Riverside Apartments investment...',
      occurredAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: 'distributions@citadel.com',
      emailTo: null,
      meetingAttendees: null,
      meetingDurationMinutes: null,
      callDirection: null,
      callDurationMinutes: null,
      source: 'email_sync',
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      tags: ['distribution'],
      deal: { id: '3', name: 'Riverside Apartments' },
    },
    {
      id: 'comm-5',
      type: 'phone_call',
      title: 'Follow-up call regarding investment documents',
      content: 'Discussed the outstanding subscription agreement and answered questions about the fund structure.',
      occurredAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: null,
      emailTo: null,
      meetingAttendees: null,
      meetingDurationMinutes: null,
      callDirection: 'inbound',
      callDurationMinutes: 15,
      source: 'manual',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      tags: ['follow-up'],
    },
    {
      id: 'comm-6',
      type: 'email',
      title: 'Tax Documents Available - K-1 Forms',
      content: 'Your K-1 tax documents for the 2023 tax year are now available in your investor portal...',
      occurredAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      emailFrom: 'tax@citadel.com',
      emailTo: null,
      meetingAttendees: null,
      meetingDurationMinutes: null,
      callDirection: null,
      callDurationMinutes: null,
      source: 'email_sync',
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      tags: ['tax', 'k1'],
    },
  ];
}

export interface CommunicationsData {
  all: InvestorCommunication[];
  previews: CommunicationPreviewItem[];
  unreadCount: number;
  byType: {
    email: InvestorCommunication[];
    meeting: InvestorCommunication[];
    phone_call: InvestorCommunication[];
  };
  byTag: Record<string, InvestorCommunication[]>;
}

export function useCommunications() {
  return useQuery({
    queryKey: ['investor', 'communications'],
    queryFn: async (): Promise<CommunicationsData> => {
      // TODO: Replace with actual API call when endpoint is ready
      // const communications = await api.get<InvestorCommunication[]>('/investors/me/communications');
      const communications = getMockCommunications();

      // Sort by date (newest first)
      communications.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );

      // Transform to previews
      const previews = communications.map(transformToPreview);

      // Count unread
      const unreadCount = communications.filter((c) => !c.isRead).length;

      // Group by type
      const byType = {
        email: communications.filter((c) => c.type === 'email'),
        meeting: communications.filter((c) => c.type === 'meeting'),
        phone_call: communications.filter((c) => c.type === 'phone_call'),
      };

      // Group by tag
      const byTag: Record<string, InvestorCommunication[]> = {};
      communications.forEach((c) => {
        c.tags?.forEach((tag) => {
          if (!byTag[tag]) byTag[tag] = [];
          byTag[tag].push(c);
        });
      });

      return {
        all: communications,
        previews,
        unreadCount,
        byType,
        byTag,
      };
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communicationId: string) => {
      // TODO: Replace with actual API call
      // await api.patch(`/communications/${communicationId}/read`);
      return communicationId;
    },
    onMutate: async (communicationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['investor', 'communications'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<CommunicationsData>(['investor', 'communications']);

      // Optimistically update to the new value
      if (previousData) {
        const updatedAll = previousData.all.map((c) =>
          c.id === communicationId ? { ...c, isRead: true } : c
        );
        const updatedPreviews = previousData.previews.map((p) =>
          p.id === communicationId ? { ...p, isRead: true } : p
        );
        const newUnreadCount = updatedAll.filter((c) => !c.isRead).length;

        queryClient.setQueryData<CommunicationsData>(['investor', 'communications'], {
          ...previousData,
          all: updatedAll,
          previews: updatedPreviews,
          unreadCount: newUnreadCount,
          byType: {
            email: updatedAll.filter((c) => c.type === 'email'),
            meeting: updatedAll.filter((c) => c.type === 'meeting'),
            phone_call: updatedAll.filter((c) => c.type === 'phone_call'),
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _communicationId, context) => {
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(['investor', 'communications'], context.previousData);
      }
    },
  });
}
