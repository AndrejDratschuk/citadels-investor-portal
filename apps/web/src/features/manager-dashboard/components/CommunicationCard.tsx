import { Mail, Video, Phone, MoreHorizontal, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Communication, CommunicationType } from '@altsui/shared';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CommunicationCardProps {
  communication: Communication;
  onDelete?: (id: string) => void;
}

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

export function CommunicationCard({ communication, onDelete }: CommunicationCardProps) {
  const config = typeConfig[communication.type];
  const Icon = config.icon;

  const getSubtitle = () => {
    switch (communication.type) {
      case 'email':
        return `From: ${communication.emailFrom || 'Unknown'}`;
      case 'meeting':
        if (communication.meetingDurationMinutes) {
          return `Duration: ${communication.meetingDurationMinutes} minutes`;
        }
        return communication.meetingAttendees?.length
          ? `Attendees: ${communication.meetingAttendees.join(', ')}`
          : 'Meeting notes';
      case 'phone_call':
        const direction = communication.callDirection === 'inbound' ? 'Inbound' : 'Outbound';
        const duration = communication.callDurationMinutes
          ? ` • ${communication.callDurationMinutes} min`
          : '';
        return `${direction} call${duration}`;
      default:
        return '';
    }
  };

  return (
    <div className="flex items-start justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          config.bgColor
        )}>
          <Icon className={cn('h-5 w-5', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{communication.title}</p>
            {communication.type === 'phone_call' && communication.callDirection && (
              communication.callDirection === 'inbound' ? (
                <ArrowDownLeft className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              )
            )}
          </div>
          <p className="text-sm text-muted-foreground">{getSubtitle()}</p>
          {communication.content && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {communication.content}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(communication.occurredAt)}
        </div>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          config.bgColor,
          config.iconColor
        )}>
          {config.label}
        </span>
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}




























