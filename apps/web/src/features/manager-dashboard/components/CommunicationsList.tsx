import { useState } from 'react';
import { MessageSquare, Mail, Video, Phone, Filter } from 'lucide-react';
import { Communication, CommunicationType } from '@flowveda/shared';
import { CommunicationCard } from './CommunicationCard';
import { cn } from '@/lib/utils';

interface CommunicationsListProps {
  communications: Communication[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

type FilterType = 'all' | CommunicationType;

const filterOptions: { id: FilterType; label: string; icon: typeof Mail }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'email', label: 'Emails', icon: Mail },
  { id: 'meeting', label: 'Meetings', icon: Video },
  { id: 'phone_call', label: 'Phone Calls', icon: Phone },
];

export function CommunicationsList({
  communications,
  isLoading,
  onDelete,
}: CommunicationsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredCommunications = communications.filter((c) => {
    if (filter === 'all') return true;
    return c.type === filter;
  });

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
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        {filterOptions.map((option) => {
          const Icon = option.icon;
          const count = option.id === 'all'
            ? communications.length
            : communications.filter((c) => c.type === option.id).length;
          
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

