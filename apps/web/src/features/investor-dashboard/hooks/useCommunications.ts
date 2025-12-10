import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investorsApi, InvestorCommunication as ApiCommunication } from '@/lib/api/investors';
import { CommunicationPreviewItem, CommunicationType } from '../components/CommunicationsPreview';

// Re-export the type for use in other files
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
  isRead: boolean;
  readAt?: string | null;
  tags: string[];
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
    isRead: communication.isRead ?? false,
    tags: communication.tags,
    dealName: communication.deal?.name,
  };
}

// Transform API response to internal format
function transformApiCommunication(api: ApiCommunication): InvestorCommunication {
  return {
    id: api.id,
    type: api.type,
    title: api.title,
    content: api.content,
    occurredAt: api.occurredAt,
    emailFrom: api.emailFrom,
    emailTo: api.emailTo,
    meetingAttendees: api.meetingAttendees,
    meetingDurationMinutes: api.meetingDurationMinutes,
    callDirection: api.callDirection,
    callDurationMinutes: api.callDurationMinutes,
    source: api.source,
    createdAt: api.createdAt,
    isRead: api.isRead ?? false,
    readAt: api.readAt,
    tags: api.tags || [],
    deal: api.deal,
  };
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
      let communications: InvestorCommunication[] = [];
      
      console.log('[Investor Communications] Fetching communications...');
      
      try {
        // Fetch from real API
        const apiCommunications = await investorsApi.getMyCommunications();
        console.log('[Investor Communications] Received from API:', apiCommunications?.length || 0, 'communications');
        console.log('[Investor Communications] Raw data:', JSON.stringify(apiCommunications?.slice(0, 2)));
        
        // Transform to internal format
        communications = apiCommunications.map(transformApiCommunication);
        console.log('[Investor Communications] Transformed:', communications.length, 'communications');
      } catch (error) {
        // If API fails (e.g., migration not run), return empty data
        console.error('[Investor Communications] Failed to fetch:', error);
        communications = [];
      }

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

// Default suggested tags
export const suggestedTags = [
  'important',
  'follow-up',
  'capital-call',
  'distribution',
  'quarterly-report',
  'tax',
  'k1',
  'meeting',
  'action-required',
  'archived',
];

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (communicationId: string) => {
      // Call real API
      await investorsApi.markCommunicationRead(communicationId);
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
          c.id === communicationId ? { ...c, isRead: true, readAt: new Date().toISOString() } : c
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
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['investor', 'communications'] });
    },
  });
}

interface UpdateTagsInput {
  communicationId: string;
  tags: string[];
}

export function useUpdateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ communicationId, tags }: UpdateTagsInput) => {
      // Call real API
      await investorsApi.updateCommunicationTags(communicationId, tags);
      return { communicationId, tags };
    },
    onMutate: async ({ communicationId, tags }) => {
      await queryClient.cancelQueries({ queryKey: ['investor', 'communications'] });

      const previousData = queryClient.getQueryData<CommunicationsData>(['investor', 'communications']);

      if (previousData) {
        const updatedAll = previousData.all.map((c) =>
          c.id === communicationId ? { ...c, tags } : c
        );
        const updatedPreviews = previousData.previews.map((p) =>
          p.id === communicationId ? { ...p, tags } : p
        );

        // Rebuild byTag
        const byTag: Record<string, InvestorCommunication[]> = {};
        updatedAll.forEach((c) => {
          c.tags?.forEach((tag) => {
            if (!byTag[tag]) byTag[tag] = [];
            byTag[tag].push(c);
          });
        });

        queryClient.setQueryData<CommunicationsData>(['investor', 'communications'], {
          ...previousData,
          all: updatedAll,
          previews: updatedPreviews,
          byTag,
          byType: {
            email: updatedAll.filter((c) => c.type === 'email'),
            meeting: updatedAll.filter((c) => c.type === 'meeting'),
            phone_call: updatedAll.filter((c) => c.type === 'phone_call'),
          },
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['investor', 'communications'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['investor', 'communications'] });
    },
  });
}
