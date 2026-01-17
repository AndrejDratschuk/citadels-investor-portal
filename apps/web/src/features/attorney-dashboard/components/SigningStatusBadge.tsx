import { cn } from '@/lib/utils';
import { Clock, Send, Eye, CheckCircle2, XCircle } from 'lucide-react';

export type SigningStatus = 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined';

interface SigningStatusBadgeProps {
  status: SigningStatus;
  className?: string;
}

const statusConfig: Record<SigningStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  not_sent: {
    label: 'Not Sent',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  viewed: {
    label: 'Viewed',
    icon: Eye,
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  signed: {
    label: 'Signed',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function SigningStatusBadge({ status, className }: SigningStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}









































