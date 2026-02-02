import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Mail,
  Video,
  Phone,
  Filter,
  Search,
  Building2,
  User,
  Tag,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { investorsApi } from '@/lib/api/investors';
import { communicationsApi } from '@/lib/api/communications';
import {
  CommunicationRow,
  ComposeEmailModal,
  CommunicationDetail,
  filterOptions,
  directionOptions,
  isSentToInvestor,
  mockDeals,
  mockInvestors,
  type Communication,
  type FilterType,
  type DirectionFilter,
} from '../components/communications';

export function ManagerCommunications(): JSX.Element {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');
  const [dealFilter, setDealFilter] = useState<string | null>(
    searchParams.get('deal') || null
  );
  const [investorFilter, setInvestorFilter] = useState<string | null>(
    searchParams.get('investor') || null
  );
  const [tagFilter, setTagFilter] = useState<string | null>(searchParams.get('tag') || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [replyToCommunication, setReplyToCommunication] = useState<Communication | null>(null);
  const [forwardCommunication, setForwardCommunication] = useState<Communication | null>(null);

  // Fetch real investors from API
  const { data: investorsList } = useQuery({
    queryKey: ['investors'],
    queryFn: investorsApi.getAll,
  });

  // Fetch real communications from API
  const { data: communicationsList } = useQuery({
    queryKey: ['manager', 'communications'],
    queryFn: communicationsApi.getAll,
  });

  // Transform API data to Communication type
  const communications: Communication[] = (communicationsList || []).map((c: unknown) => {
    const comm = c as Record<string, unknown>;
    return {
      id: comm.id as string,
      type: comm.type as Communication['type'],
      title: comm.title as string,
      content: comm.content as string | null,
      occurredAt: comm.occurredAt as string,
      emailFrom: comm.emailFrom as string | null,
      emailTo: comm.emailTo as string | null,
      meetingAttendees: comm.meetingAttendees as string[] | null,
      meetingDurationMinutes: comm.meetingDurationMinutes as number | null,
      callDirection: comm.callDirection as 'inbound' | 'outbound' | null,
      callDurationMinutes: comm.callDurationMinutes as number | null,
      source: comm.source as string,
      createdAt: comm.createdAt as string,
      tags: (comm.tags as string[]) || [],
      investor: comm.investor as Communication['investor'],
      deal: comm.deal as Communication['deal'],
      managerRead: (comm.managerRead as boolean) ?? true,
      managerReadAt: (comm.managerReadAt as string) || null,
    };
  });

  // Count unread communications
  const unreadCount = communications.filter((c) => !c.managerRead).length;

  // Transform investors for the modal
  const investorsForModal = (investorsList || []).map((inv) => ({
    id: inv.id,
    name: `${inv.firstName} ${inv.lastName}`,
    email: inv.email,
  }));

  // Use real investors if available, otherwise fall back to mock
  const displayInvestors = investorsForModal.length > 0 ? investorsForModal : mockInvestors;

  // Filter communications
  const filteredCommunications = filterCommunications(communications, {
    typeFilter,
    directionFilter,
    dealFilter,
    investorFilter,
    tagFilter,
    searchQuery,
  });

  // Count by direction
  const sentCount = communications.filter((c) =>
    c.type === 'email' || c.type === 'phone_call' ? isSentToInvestor(c) : true
  ).length;
  const receivedCount = communications.filter((c) =>
    c.type === 'email' || c.type === 'phone_call' ? !isSentToInvestor(c) : true
  ).length;

  const selectedCommunication = selectedId
    ? communications.find((c) => c.id === selectedId)
    : null;

  // Handle communication selection and mark as read
  async function handleSelectCommunication(communication: Communication): Promise<void> {
    setSelectedId(communication.id);

    // Mark as read if unread
    if (!communication.managerRead) {
      try {
        await communicationsApi.markAsRead(communication.id);
        queryClient.invalidateQueries({ queryKey: ['manager', 'communications'] });
      } catch (error) {
        console.error('Failed to mark communication as read:', error);
      }
    }
  }

  // Get unique tags from communications
  const availableTags = Array.from(new Set(communications.flatMap((c) => c.tags)));

  // Count by type
  const typeCounts = {
    all: communications.length,
    email: communications.filter((c) => c.type === 'email').length,
    meeting: communications.filter((c) => c.type === 'meeting').length,
    phone_call: communications.filter((c) => c.type === 'phone_call').length,
  };

  function clearFilters(): void {
    setTypeFilter('all');
    setDirectionFilter('all');
    setDealFilter(null);
    setInvestorFilter(null);
    setTagFilter(null);
    setSearchQuery('');
    setSearchParams({});
  }

  const hasActiveFilters =
    typeFilter !== 'all' ||
    directionFilter !== 'all' ||
    !!dealFilter ||
    !!investorFilter ||
    !!tagFilter ||
    !!searchQuery;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        unreadCount={unreadCount}
        onCompose={() => setShowComposeModal(true)}
      />

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal || !!replyToCommunication || !!forwardCommunication}
        onClose={() => {
          setShowComposeModal(false);
          setReplyToCommunication(null);
          setForwardCommunication(null);
        }}
        investors={displayInvestors}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['manager', 'communications'] });
        }}
        replyTo={replyToCommunication}
        forwardFrom={forwardCommunication}
      />

      {/* Direction Tabs (Sent/Received) */}
      <DirectionTabs
        directionFilter={directionFilter}
        onDirectionChange={setDirectionFilter}
        totalCount={communications.length}
        sentCount={sentCount}
        receivedCount={receivedCount}
      />

      {/* Stats */}
      <StatsCards typeCounts={typeCounts} />

      {/* Search & Filters */}
      <FiltersSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        typeCounts={typeCounts}
        dealFilter={dealFilter}
        onDealFilterChange={setDealFilter}
        investorFilter={investorFilter}
        onInvestorFilterChange={setInvestorFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        availableTags={availableTags}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Communications List & Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* List */}
        <div
          className={cn(
            'lg:col-span-2 rounded-xl border bg-card overflow-hidden',
            selectedCommunication && 'hidden lg:block'
          )}
        >
          {filteredCommunications.length === 0 ? (
            <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
          ) : (
            <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
              {filteredCommunications.map((communication) => (
                <CommunicationRow
                  key={communication.id}
                  communication={communication}
                  isSelected={selectedId === communication.id}
                  onClick={() => handleSelectCommunication(communication)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div
          className={cn(
            'lg:col-span-3 rounded-xl border bg-card overflow-hidden',
            !selectedCommunication && 'hidden lg:flex lg:items-center lg:justify-center'
          )}
        >
          {selectedCommunication ? (
            <CommunicationDetail
              communication={selectedCommunication}
              onBack={() => setSelectedId(null)}
              onReply={(comm) => setReplyToCommunication(comm)}
              onForward={(comm) => setForwardCommunication(comm)}
            />
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">
                Select a communication to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================
interface FilterParams {
  typeFilter: FilterType;
  directionFilter: DirectionFilter;
  dealFilter: string | null;
  investorFilter: string | null;
  tagFilter: string | null;
  searchQuery: string;
}

function filterCommunications(
  communications: Communication[],
  params: FilterParams
): Communication[] {
  return communications.filter((c) => {
    if (params.typeFilter !== 'all' && c.type !== params.typeFilter) return false;
    if (params.dealFilter && c.deal?.id !== params.dealFilter) return false;
    if (params.investorFilter && c.investor.id !== params.investorFilter) return false;
    if (params.tagFilter && !c.tags.includes(params.tagFilter)) return false;

    // Direction filter
    if (params.directionFilter !== 'all') {
      if (c.type === 'email' || c.type === 'phone_call') {
        const isSent = isSentToInvestor(c);
        if (params.directionFilter === 'sent' && !isSent) return false;
        if (params.directionFilter === 'received' && isSent) return false;
      }
    }

    if (params.searchQuery) {
      const query = params.searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(query);
      const matchesContent = c.content?.toLowerCase().includes(query);
      const matchesInvestor = c.investor.name.toLowerCase().includes(query);
      const matchesDeal = c.deal?.name.toLowerCase().includes(query);
      if (!matchesTitle && !matchesContent && !matchesInvestor && !matchesDeal) return false;
    }
    return true;
  });
}

// ============================================
// Sub-components
// ============================================
interface PageHeaderProps {
  unreadCount: number;
  onCompose: () => void;
}

function PageHeader({ unreadCount, onCompose }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Communications</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all investor communications
        </p>
      </div>
      <div className="flex items-center gap-3">
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-700">{unreadCount} unread</span>
          </div>
        )}
        <Button onClick={onCompose}>
          <Plus className="h-4 w-4 mr-2" />
          New Communication
        </Button>
      </div>
    </div>
  );
}

interface DirectionTabsProps {
  directionFilter: DirectionFilter;
  onDirectionChange: (direction: DirectionFilter) => void;
  totalCount: number;
  sentCount: number;
  receivedCount: number;
}

function DirectionTabs({
  directionFilter,
  onDirectionChange,
  totalCount,
  sentCount,
  receivedCount,
}: DirectionTabsProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      {directionOptions.map((option) => {
        const Icon = option.icon;
        const count =
          option.id === 'all' ? totalCount : option.id === 'sent' ? sentCount : receivedCount;

        return (
          <button
            key={option.id}
            onClick={() => onDirectionChange(option.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-3',
              directionFilter === option.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                directionFilter === option.id ? 'bg-primary/10 text-primary' : 'bg-muted'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface StatsCardsProps {
  typeCounts: Record<FilterType, number>;
}

function StatsCards({ typeCounts }: StatsCardsProps): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          Total
        </div>
        <p className="mt-1 text-2xl font-bold">{typeCounts.all}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4 text-blue-600" />
          Emails
        </div>
        <p className="mt-1 text-2xl font-bold">{typeCounts.email}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="h-4 w-4 text-purple-600" />
          Meetings
        </div>
        <p className="mt-1 text-2xl font-bold">{typeCounts.meeting}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 text-green-600" />
          Calls
        </div>
        <p className="mt-1 text-2xl font-bold">{typeCounts.phone_call}</p>
      </div>
    </div>
  );
}

interface FiltersSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: FilterType;
  onTypeFilterChange: (filter: FilterType) => void;
  typeCounts: Record<FilterType, number>;
  dealFilter: string | null;
  onDealFilterChange: (deal: string | null) => void;
  investorFilter: string | null;
  onInvestorFilterChange: (investor: string | null) => void;
  tagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
  availableTags: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function FiltersSection({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  typeCounts,
  dealFilter,
  onDealFilterChange,
  investorFilter,
  onInvestorFilterChange,
  tagFilter,
  onTagFilterChange,
  availableTags,
  hasActiveFilters,
  onClearFilters,
}: FiltersSectionProps): JSX.Element {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search communications..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => onTypeFilterChange(option.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                typeFilter === option.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  typeFilter === option.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background'
                )}
              >
                {typeCounts[option.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Deal Filter */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <select
            value={dealFilter || ''}
            onChange={(e) => onDealFilterChange(e.target.value || null)}
            className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Deals</option>
            {mockDeals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Investor Filter */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <select
            value={investorFilter || ''}
            onChange={(e) => onInvestorFilterChange(e.target.value || null)}
            className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Investors</option>
            {mockInvestors.map((investor) => (
              <option key={investor.id} value={investor.id}>
                {investor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <select
            value={tagFilter || ''}
            onChange={(e) => onTagFilterChange(e.target.value || null)}
            className="rounded-lg border bg-card px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function EmptyState({ hasActiveFilters, onClearFilters }: EmptyStateProps): JSX.Element {
  return (
    <div className="p-8 text-center">
      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 font-semibold">No communications found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasActiveFilters ? 'Try adjusting your filters' : 'No communications yet'}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
