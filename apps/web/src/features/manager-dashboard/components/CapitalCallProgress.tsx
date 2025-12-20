import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface CapitalCallProgressProps {
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  className?: string;
}

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const statusStyles = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  funded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-muted text-muted-foreground',
};

export function CapitalCallProgress({
  dealName,
  totalAmount,
  receivedAmount,
  deadline,
  status,
  className,
}: CapitalCallProgressProps) {
  const progress = totalAmount > 0 ? (receivedAmount / totalAmount) * 100 : 0;
  const isOverdue = new Date(deadline) < new Date() && status !== 'funded' && status !== 'closed';
  const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-3', isOverdue && 'border-red-300', className)}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h4 className="text-sm font-medium truncate">{dealName}</h4>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
            <Calendar className="h-3 w-3" />
            {isOverdue ? (
              <span className="text-red-500 font-medium">Overdue</span>
            ) : (
              <span>{daysLeft}d left</span>
            )}
          </div>
        </div>
        <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', statusStyles[status])}>
          {status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium w-10 text-right">{progress.toFixed(0)}%</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-muted-foreground">
          {formatCompact(receivedAmount)} <span className="text-muted-foreground/60">of</span> {formatCompact(totalAmount)}
        </span>
        <span className={cn('font-medium', progress >= 100 ? 'text-emerald-600' : 'text-muted-foreground')}>
          {formatCompact(totalAmount - receivedAmount)} left
        </span>
      </div>
    </div>
  );
}


