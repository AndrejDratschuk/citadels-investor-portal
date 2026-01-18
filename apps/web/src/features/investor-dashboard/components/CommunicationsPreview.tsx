import { Link } from 'react-router-dom';
import {
  Mail,
  Video,
  Phone,
  MessageSquare,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';

export type CommunicationType = 'email' | 'meeting' | 'phone_call';

export interface CommunicationPreviewItem {
  id: string;
  type: CommunicationType;
  subject: string;
  from: string;
  date: string;
  preview?: string;
  isRead: boolean;
  tags?: string[];
  dealName?: string;
}

interface CommunicationsPreviewProps {
  communications: CommunicationPreviewItem[];
  isLoading?: boolean;
  limit?: number;
  className?: string;
}

const typeConfig: Record<CommunicationType, {
  icon: typeof Mail;
  bgColor: string;
  iconColor: string;
}> = {
  email: {
    icon: Mail,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  meeting: {
    icon: Video,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  phone_call: {
    icon: Phone,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
  },
};

function CommunicationPreviewRow({ communication }: { communication: CommunicationPreviewItem }) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  return (
    <Link
      to={`/investor/communications/${communication.id}`}
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0',
        !communication.isRead && 'bg-blue-50/30'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
          config.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm truncate',
              !communication.isRead ? 'font-semibold' : 'font-medium'
            )}
          >
            {communication.subject}
          </p>
          {!communication.isRead && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{communication.from}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(communication.date)}</span>
          </div>
        </div>
        {communication.preview && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {communication.preview}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CommunicationsPreview({
  communications,
  isLoading,
  limit = 5,
  className,
}: CommunicationsPreviewProps) {
  const displayedCommunications = communications.slice(0, limit);
  const unreadCount = communications.filter((c) => !c.isRead).length;

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Communications</h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="animate-pulse">
            <div className="mx-auto h-8 w-8 rounded-full bg-muted" />
            <div className="mt-3 h-4 w-32 mx-auto rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Communications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link
          to="/investor/communications"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Communications List */}
      {displayedCommunications.length === 0 ? (
        <div className="p-8 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">No communications yet</p>
        </div>
      ) : (
        <div>
          {displayedCommunications.map((communication) => (
            <CommunicationPreviewRow
              key={communication.id}
              communication={communication}
            />
          ))}
        </div>
      )}

      {/* Footer - Show more link if there are more */}
      {communications.length > limit && (
        <div className="border-t p-3">
          <Link to="/investor/communications">
            <Button variant="ghost" className="w-full" size="sm">
              View {communications.length - limit} more communications
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

































