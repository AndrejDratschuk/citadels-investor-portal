/**
 * Visibility Badge - Shows which roles can view a note
 */

import { cn } from '@/lib/utils';
import type { NoteVisibility } from '@altsui/shared';

interface VisibilityBadgeProps {
  visibility: NoteVisibility;
  size?: 'sm' | 'md';
}

const visibilityConfig: Record<NoteVisibility, { label: string; color: string }> = {
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700' },
  accountant: { label: 'Accountant', color: 'bg-purple-100 text-purple-700' },
  attorney: { label: 'Attorney', color: 'bg-amber-100 text-amber-700' },
  investor: { label: 'Investor', color: 'bg-green-100 text-green-700' },
};

export function VisibilityBadge({ visibility, size = 'sm' }: VisibilityBadgeProps): JSX.Element {
  const config = visibilityConfig[visibility];

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

