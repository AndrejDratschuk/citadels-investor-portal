import { useQuery } from '@tanstack/react-query';
import { investorsApi, CapitalCallItem } from '@/lib/api/investors';
import { Notice, NoticeType } from '../components/NoticeCard';

// Transform capital calls into notices
function transformCapitalCallToNotice(capitalCall: CapitalCallItem): Notice {
  const remaining = capitalCall.amountDue - capitalCall.amountReceived;
  const isOverdue =
    capitalCall.capitalCall?.deadline &&
    new Date(capitalCall.capitalCall.deadline) < new Date() &&
    capitalCall.status !== 'complete';

  return {
    id: capitalCall.id,
    type: 'capital_call' as NoticeType,
    title: capitalCall.capitalCall?.deal?.name
      ? `Capital Call - ${capitalCall.capitalCall.deal.name}`
      : 'Capital Call',
    amount: capitalCall.amountDue,
    amountReceived: capitalCall.amountReceived,
    deadline: capitalCall.capitalCall?.deadline,
    status: capitalCall.status as Notice['status'],
    priority: isOverdue ? 'high' : remaining > 0 ? 'medium' : 'low',
    createdAt: capitalCall.createdAt,
    deal: capitalCall.capitalCall?.deal,
    actionRequired: remaining > 0,
    actionLabel: 'View Wire Instructions',
    actionUrl: `/investor/capital-calls/${capitalCall.id}`,
  };
}

// Mock additional notices for demonstration
// In production, these would come from an API endpoint
function getMockNotices(): Notice[] {
  return [
    {
      id: 'dist-1',
      type: 'distribution',
      title: 'Q4 2024 Distribution',
      description: 'Your quarterly distribution for Riverside Apartments is ready.',
      amount: 12500,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      deal: { id: '3', name: 'Riverside Apartments' },
      actionRequired: false,
    },
    {
      id: 'election-1',
      type: 'distribution_election',
      title: 'Distribution Election Required',
      description:
        'Please select your preference for the upcoming distribution: cash payment or reinvestment into the fund.',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      priority: 'high',
      createdAt: new Date().toISOString(),
      deal: { id: '1', name: 'Downtown Office Tower' },
      actionRequired: true,
      actionLabel: 'Make Election',
      actionUrl: '/investor/elections/election-1',
    },
    {
      id: 'meeting-1',
      type: 'quarterly_meeting',
      title: 'Q1 2025 Investor Meeting',
      description:
        'Join us for our quarterly investor update where we will discuss fund performance, market outlook, and upcoming opportunities.',
      meetingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      actionRequired: true,
      actionLabel: 'RSVP Now',
      actionUrl: '/investor/meetings/meeting-1',
    },
    {
      id: 'announce-1',
      type: 'announcement',
      title: 'New Investment Opportunity',
      description:
        'We are pleased to announce a new investment opportunity in the Tech Campus Development project. Early commitment window now open.',
      status: 'unread',
      priority: 'low',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      actionRequired: false,
    },
  ];
}

export interface NoticesData {
  all: Notice[];
  capitalCalls: Notice[];
  distributions: Notice[];
  elections: Notice[];
  meetings: Notice[];
  announcements: Notice[];
  actionRequired: Notice[];
  counts: {
    total: number;
    capitalCalls: number;
    distributions: number;
    elections: number;
    meetings: number;
    announcements: number;
    actionRequired: number;
  };
}

export function useNotices() {
  return useQuery({
    queryKey: ['investor', 'notices'],
    queryFn: async (): Promise<NoticesData> => {
      // Fetch capital calls from API
      const capitalCalls = await investorsApi.getMyCapitalCalls();

      // Transform capital calls to notices
      const capitalCallNotices = capitalCalls.map(transformCapitalCallToNotice);

      // Get other notices (in production, these would come from separate API endpoints)
      const otherNotices = getMockNotices();

      // Combine all notices
      const allNotices = [...capitalCallNotices, ...otherNotices];

      // Sort by priority (high first) then by date (newest first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      allNotices.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Categorize notices
      const categorized: NoticesData = {
        all: allNotices,
        capitalCalls: allNotices.filter((n) => n.type === 'capital_call'),
        distributions: allNotices.filter((n) => n.type === 'distribution'),
        elections: allNotices.filter((n) => n.type === 'distribution_election'),
        meetings: allNotices.filter((n) => n.type === 'quarterly_meeting'),
        announcements: allNotices.filter((n) => n.type === 'announcement'),
        actionRequired: allNotices.filter((n) => n.actionRequired),
        counts: {
          total: allNotices.length,
          capitalCalls: allNotices.filter((n) => n.type === 'capital_call').length,
          distributions: allNotices.filter((n) => n.type === 'distribution').length,
          elections: allNotices.filter((n) => n.type === 'distribution_election').length,
          meetings: allNotices.filter((n) => n.type === 'quarterly_meeting').length,
          announcements: allNotices.filter((n) => n.type === 'announcement').length,
          actionRequired: allNotices.filter((n) => n.actionRequired).length,
        },
      };

      return categorized;
    },
  });
}

// Keep the original hook for backwards compatibility
export { useCapitalCalls } from './useCapitalCalls';


