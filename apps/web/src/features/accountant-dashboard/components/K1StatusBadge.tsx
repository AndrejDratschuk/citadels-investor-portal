import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, Send, AlertCircle } from 'lucide-react';

export type K1Status = 'pending' | 'generated' | 'sent' | 'error';

interface K1StatusBadgeProps {
  status: K1Status;
  className?: string;
}

const statusConfig: Record<K1Status, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  generated: {
    label: 'Generated',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  sent: {
    label: 'Sent',
    icon: Send,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function K1StatusBadge({ status, className }: K1StatusBadgeProps) {
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































