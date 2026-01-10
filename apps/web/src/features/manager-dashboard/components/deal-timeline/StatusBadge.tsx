/**
 * Status Badge - Milestone status indicator
 */

import { cn } from '@/lib/utils';
import type { MilestoneStatus } from '@altsui/shared';

interface StatusBadgeProps {
  status: MilestoneStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<MilestoneStatus, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  delayed: { label: 'Delayed', color: 'bg-orange-100 text-orange-700' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps): JSX.Element {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}

