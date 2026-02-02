import { User, Building2, ChevronRight } from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { cn } from '@/lib/utils';
import { typeConfig, type Communication } from './communicationsConfig';

interface CommunicationRowProps {
  communication: Communication;
  isSelected: boolean;
  onClick: () => void;
}

export function CommunicationRow({
  communication,
  isSelected,
  onClick,
}: CommunicationRowProps): JSX.Element {
  const config = typeConfig[communication.type];
  const Icon = config.icon;
  const isUnread = !communication.managerRead;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary',
        isUnread && !isSelected && 'bg-blue-50/50'
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
              isUnread ? 'font-semibold' : 'font-medium'
            )}
          >
            {communication.title}
          </p>
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{communication.investor.name}</span>
          </div>
          <span>•</span>
          <span className="whitespace-nowrap">{formatDate(communication.occurredAt)}</span>
        </div>
        {communication.deal && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{communication.deal.name}</span>
          </div>
        )}
        {communication.tags.length > 0 && (
          <CommunicationTags tags={communication.tags} />
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

interface CommunicationTagsProps {
  tags: string[];
}

function CommunicationTags({ tags }: CommunicationTagsProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {tags.slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
        >
          {tag}
        </span>
      ))}
      {tags.length > 2 && (
        <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
      )}
    </div>
  );
}
