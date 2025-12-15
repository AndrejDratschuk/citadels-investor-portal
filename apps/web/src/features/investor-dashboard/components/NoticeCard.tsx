import {
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  RefreshCcw,
  Users,
  Megaphone,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';

export type NoticeType =
  | 'capital_call'
  | 'distribution'
  | 'distribution_election'
  | 'quarterly_meeting'
  | 'announcement';

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  description?: string;
  amount?: number;
  amountReceived?: number;
  deadline?: string;
  meetingDate?: string;
  status: 'pending' | 'partial' | 'complete' | 'upcoming' | 'read' | 'unread';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  deal?: {
    id: string;
    name: string;
  } | null;
  actionRequired?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

interface NoticeCardProps {
  notice: Notice;
  className?: string;
  onAction?: (notice: Notice) => void;
}

const noticeTypeConfig = {
  capital_call: {
    icon: DollarSign,
    label: 'Capital Call',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200',
  },
  distribution: {
    icon: TrendingUp,
    label: 'Distribution',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
  },
  distribution_election: {
    icon: RefreshCcw,
    label: 'Distribution Election',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
  },
  quarterly_meeting: {
    icon: Users,
    label: 'Quarterly Meeting',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
  },
  announcement: {
    icon: Megaphone,
    label: 'Announcement',
    bgColor: 'bg-slate-50',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
};

const priorityStyles = {
  high: 'border-red-300 bg-red-50/50',
  medium: '',
  low: 'opacity-80',
};

export function NoticeCard({ notice, className, onAction }: NoticeCardProps) {
  const config = noticeTypeConfig[notice.type];
  const Icon = config.icon;

  const isOverdue =
    notice.deadline &&
    new Date(notice.deadline) < new Date() &&
    notice.status !== 'complete';

  const isUpcoming =
    notice.meetingDate && new Date(notice.meetingDate) > new Date();

  const remaining =
    notice.amount && notice.amountReceived !== undefined
      ? notice.amount - notice.amountReceived
      : null;

  const getStatusBadge = () => {
    if (isOverdue) {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          Overdue
        </div>
      );
    }

    switch (notice.status) {
      case 'complete':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete
          </div>
        );
      case 'partial':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-orange-600">
            <Clock className="h-3.5 w-3.5" />
            In Progress
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-yellow-600">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </div>
        );
      case 'upcoming':
        return (
          <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
            <Calendar className="h-3.5 w-3.5" />
            Upcoming
          </div>
        );
      case 'unread':
        return (
          <div className="h-2 w-2 rounded-full bg-blue-500" title="Unread" />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md',
        isOverdue && 'border-red-300 bg-red-50/30',
        notice.priority === 'high' && !isOverdue && priorityStyles.high,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isOverdue ? 'bg-red-100' : config.iconBg
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isOverdue ? 'text-red-600' : config.iconColor
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  config.bgColor,
                  config.iconColor
                )}
              >
                {config.label}
              </span>
              {getStatusBadge()}
            </div>
            <p className="mt-1 font-semibold">{notice.title}</p>
            {notice.deal && (
              <p className="text-sm text-muted-foreground">{notice.deal.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {notice.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {notice.description}
        </p>
      )}

      {/* Financial Details for Capital Calls / Distributions */}
      {notice.type === 'capital_call' && notice.amount !== undefined && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="mt-0.5 font-semibold">{formatCurrency(notice.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="mt-0.5 font-semibold text-green-600">
              {formatCurrency(notice.amountReceived || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={cn(
                'mt-0.5 font-semibold',
                remaining && remaining > 0 ? 'text-orange-600' : 'text-green-600'
              )}
            >
              {formatCurrency(remaining || 0)}
            </p>
          </div>
        </div>
      )}

      {notice.type === 'distribution' && notice.amount !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <div>
              <p className="text-xs text-green-700">Distribution Amount</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(notice.amount)}
              </p>
            </div>
            {notice.status === 'complete' && (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            )}
          </div>
        </div>
      )}

      {notice.type === 'distribution_election' && (
        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50/50 p-3">
          <p className="text-sm text-purple-700">
            <FileText className="mr-1 inline h-4 w-4" />
            Action required: Choose to receive distribution or reinvest
          </p>
        </div>
      )}

      {/* Date/Time Info */}
      <div className="mt-4 flex items-center gap-4 text-sm">
        {notice.deadline && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Due: {formatDate(notice.deadline)}
            </span>
          </div>
        )}
        {notice.meetingDate && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {isUpcoming ? 'Scheduled' : 'Meeting'}: {formatDate(notice.meetingDate)}
            </span>
          </div>
        )}
        {!notice.deadline && !notice.meetingDate && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(notice.createdAt)}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {notice.actionRequired && (
        <div className="mt-4">
          <Button
            className="w-full"
            size="sm"
            variant={isOverdue ? 'destructive' : 'default'}
            onClick={() => onAction?.(notice)}
          >
            {notice.actionLabel || 'Take Action'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}





