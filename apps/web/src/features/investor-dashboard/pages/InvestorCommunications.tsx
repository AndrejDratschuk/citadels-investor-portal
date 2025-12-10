import { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Video,
  Phone,
  Filter,
  Search,
  ArrowLeft,
  Clock,
  User,
  Tag,
  Building2,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCommunications, useMarkAsRead, InvestorCommunication } from '../hooks/useCommunications';
import { CommunicationType } from '../components/CommunicationsPreview';

type FilterType = 'all' | CommunicationType;
type TagFilter = string | null;

const filterOptions: { id: FilterType; label: string; icon: typeof Mail }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'meeting', label: 'Meetings', icon: Video },
  { id: 'phone_call', label: 'Calls', icon: Phone },
];

const typeConfig: Record<CommunicationType, {
  icon: typeof Mail;
  label: string;
  bgColor: string;
  iconColor: string;
}> = {
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

interface CommunicationRowProps {
  communication: InvestorCommunication;
  isSelected: boolean;
  onClick: () => void;
}

function CommunicationRow({ communication, isSelected, onClick }: CommunicationRowProps) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  let from = 'Fund Manager';
  if (communication.type === 'email' && communication.emailFrom) {
    from = communication.emailFrom;
  } else if (communication.type === 'meeting' && communication.meetingAttendees?.length) {
    from = communication.meetingAttendees[0];
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary',
        !communication.isRead && 'bg-blue-50/30'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
          config.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm truncate',
              !communication.isRead ? 'font-semibold' : 'font-medium'
            )}
          >
            {communication.title}
          </p>
          {!communication.isRead && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground truncate">{from}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(communication.occurredAt)}
          </span>
        </div>
        {communication.deal && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{communication.deal.name}</span>
          </div>
        )}
        {communication.tags && communication.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {communication.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
            {communication.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{communication.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

interface CommunicationDetailProps {
  communication: InvestorCommunication;
  onBack: () => void;
}

function CommunicationDetail({ communication, onBack }: CommunicationDetailProps) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  let from = 'Fund Manager';
  if (communication.type === 'email' && communication.emailFrom) {
    from = communication.emailFrom;
  } else if (communication.type === 'meeting' && communication.meetingAttendees?.length) {
    from = communication.meetingAttendees.join(', ');
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2 lg:hidden">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
              config.bgColor
            )}
          >
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{communication.title}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{from}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(communication.occurredAt)}</span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  config.bgColor,
                  config.iconColor
                )}
              >
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="border-b p-4 space-y-3">
        {communication.deal && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Deal:</span>
            <span className="text-sm font-medium">{communication.deal.name}</span>
          </div>
        )}
        {communication.type === 'meeting' && communication.meetingDurationMinutes && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">{communication.meetingDurationMinutes} minutes</span>
          </div>
        )}
        {communication.type === 'phone_call' && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {communication.callDirection === 'inbound' ? 'Inbound' : 'Outbound'} call
              {communication.callDurationMinutes && ` • ${communication.callDurationMinutes} min`}
            </span>
          </div>
        )}
        {communication.tags && communication.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {communication.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {communication.content ? (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{communication.content}</p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">No content available</p>
        )}
      </div>
    </div>
  );
}

export function InvestorCommunications() {
  const { data, isLoading, error } = useCommunications();
  const markAsRead = useMarkAsRead();
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [tagFilter, setTagFilter] = useState<TagFilter>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Handle selecting a communication and marking it as read
  const handleSelectCommunication = (communication: InvestorCommunication) => {
    setSelectedId(communication.id);
    // Mark as read if not already read
    if (!communication.isRead) {
      markAsRead.mutate(communication.id);
    }
  };

  // Filter communications
  const filteredCommunications = data?.all.filter((c) => {
    // Type filter
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    // Tag filter
    if (tagFilter && !c.tags?.includes(tagFilter)) return false;
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(query);
      const matchesContent = c.content?.toLowerCase().includes(query);
      const matchesDeal = c.deal?.name.toLowerCase().includes(query);
      if (!matchesTitle && !matchesContent && !matchesDeal) return false;
    }
    return true;
  }) || [];

  const selectedCommunication = selectedId
    ? data?.all.find((c) => c.id === selectedId)
    : null;

  // Get unique tags from communications
  const availableTags = Array.from(
    new Set(data?.all.flatMap((c) => c.tags || []) || [])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading communications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">Failed to load communications</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communications</h1>
          <p className="mt-1 text-muted-foreground">
            View messages and updates from your fund manager
          </p>
        </div>
        {data && data.unreadCount > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              {data.unreadCount} unread
            </span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search communications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Type Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {filterOptions.map((option) => {
            const Icon = option.icon;
            const count =
              option.id === 'all'
                ? data?.all.length || 0
                : data?.byType[option.id]?.length || 0;

            return (
              <button
                key={option.id}
                onClick={() => setTypeFilter(option.id)}
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
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => setTagFilter(null)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                tagFilter === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All Tags
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
                  tagFilter === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

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
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 font-semibold">No communications found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || tagFilter || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No communications yet'}
              </p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
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

