import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Building2,
  Users,
  Clock,
  Phone,
  Tag,
  Send,
} from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { typeConfig, type Communication } from './communicationsConfig';

interface CommunicationDetailProps {
  communication: Communication;
  onBack: () => void;
  onReply: (communication: Communication) => void;
  onForward: (communication: Communication) => void;
}

export function CommunicationDetail({
  communication,
  onBack,
  onReply,
  onForward,
}: CommunicationDetailProps): JSX.Element {
  const config = typeConfig[communication.type];
  const Icon = config.icon;
  const isEmail = communication.type === 'email';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <DetailHeader
        communication={communication}
        config={config}
        Icon={Icon}
        onBack={onBack}
      />

      {/* Metadata */}
      <DetailMetadata communication={communication} />

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

      {/* Actions - only show for emails */}
      {isEmail && (
        <div className="border-t p-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onReply(communication)}
          >
            <Mail className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onForward(communication)}
          >
            <Send className="h-4 w-4 mr-2" />
            Forward
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================
interface DetailHeaderProps {
  communication: Communication;
  config: (typeof typeConfig)[keyof typeof typeConfig];
  Icon: typeof Mail;
  onBack: () => void;
}

function DetailHeader({
  communication,
  config,
  Icon,
  onBack,
}: DetailHeaderProps): JSX.Element {
  return (
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
            <Link
              to={`/manager/investors/${communication.investor.id}`}
              className="flex items-center gap-1 hover:underline"
            >
              <User className="h-4 w-4" />
              <span>{communication.investor.name}</span>
            </Link>
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
  );
}

interface DetailMetadataProps {
  communication: Communication;
}

function DetailMetadata({ communication }: DetailMetadataProps): JSX.Element {
  return (
    <div className="border-b p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">To:</span>
        <span className="text-sm font-medium">{communication.investor.email}</span>
      </div>

      {communication.deal && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Deal:</span>
          <Link
            to={`/manager/deals/${communication.deal.id}`}
            className="text-sm font-medium hover:underline"
          >
            {communication.deal.name}
          </Link>
        </div>
      )}

      {communication.type === 'meeting' && communication.meetingAttendees && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Attendees:</span>
          <span className="text-sm font-medium">
            {communication.meetingAttendees.join(', ')}
          </span>
        </div>
      )}

      {communication.type === 'meeting' && communication.meetingDurationMinutes && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Duration:</span>
          <span className="text-sm font-medium">
            {communication.meetingDurationMinutes} minutes
          </span>
        </div>
      )}

      {communication.type === 'phone_call' && (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {communication.callDirection === 'inbound' ? 'Inbound' : 'Outbound'} call
            {communication.callDurationMinutes && ` • ${communication.callDurationMinutes} min`}
          </span>
        </div>
      )}

      {communication.tags.length > 0 && (
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
  );
}
