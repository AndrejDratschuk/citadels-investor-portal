import { useState } from 'react';
import { MessageSquare, Mail, Video, Phone, Filter, Send, Inbox } from 'lucide-react';
import { Communication, CommunicationType } from '@altsui/shared';
import { CommunicationCard } from './CommunicationCard';
import { cn } from '@/lib/utils';

interface CommunicationsListProps {
  communications: Communication[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  investorEmail?: string; // To determine sent vs received
}

type FilterType = 'all' | CommunicationType;
type DirectionFilter = 'all' | 'sent' | 'received';

const filterOptions: { id: FilterType; label: string; icon: typeof Mail }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'meeting', label: 'Meetings', icon: Video },
  { id: 'phone_call', label: 'Phone Calls', icon: Phone },
];

const directionOptions: { id: DirectionFilter; label: string; icon: typeof Send }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'received', label: 'Received', icon: Inbox },
];

export function CommunicationsList({
  communications,
  isLoading,
  onDelete,
  investorEmail,
}: CommunicationsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');

  // Determine if a communication is "sent" (to investor) or "received" (from investor)
  const isSentToInvestor = (comm: Communication): boolean => {
    if (comm.type === 'email') {
      // If emailTo matches investor email, it was sent TO the investor
      return comm.emailTo?.toLowerCase() === investorEmail?.toLowerCase();
    }
    if (comm.type === 'phone_call') {
      // Outbound calls are "sent" to investor
      return comm.callDirection === 'outbound';
    }
    // Meetings are considered neutral (shown in both)
    return true;
  };

  const filteredCommunications = communications.filter((c) => {
    // Filter by type
    if (filter !== 'all' && c.type !== filter) return false;
    
    // Filter by direction (only for emails and calls)
    if (directionFilter !== 'all') {
      if (c.type === 'email' || c.type === 'phone_call') {
        const isSent = isSentToInvestor(c);
        if (directionFilter === 'sent' && !isSent) return false;
        if (directionFilter === 'received' && isSent) return false;
      }
      // Meetings show in both sent and received
    }
    
    return true;
  });

  // Count by direction
  const sentCount = communications.filter((c) => 
    c.type === 'email' || c.type === 'phone_call' ? isSentToInvestor(c) : true
  ).length;
  const receivedCount = communications.filter((c) => 
    c.type === 'email' || c.type === 'phone_call' ? !isSentToInvestor(c) : true
  ).length;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <div className="animate-pulse">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
          <div className="mt-4 h-4 w-32 mx-auto rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Direction Tabs (Sent/Received) */}
      <div className="flex items-center gap-2 border-b pb-3">
        {directionOptions.map((option) => {
          const Icon = option.icon;
          const count = option.id === 'all'
            ? communications.length
            : option.id === 'sent'
            ? sentCount
            : receivedCount;
          
          return (
            <button
              key={option.id}
              onClick={() => setDirectionFilter(option.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-3',
                directionFilter === option.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {option.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                directionFilter === option.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const count = option.id === 'all'
            ? filteredCommunications.length
            : filteredCommunications.filter((c) => c.type === option.id).length;
          
          return (
            <button
              key={option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                filter === option.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                filter === option.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-background'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Communications List */}
      <div className="rounded-xl border bg-card">
        {filteredCommunications.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              {filter === 'all'
                ? 'No communications yet'
                : `No ${filterOptions.find((o) => o.id === filter)?.label.toLowerCase()} yet`}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCommunications.map((communication) => (
              <CommunicationCard
                key={communication.id}
                communication={communication}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}






