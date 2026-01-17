/**
 * Milestone View Toggle - Switch between Planned, Actual, and Comparison views
 * Follows the same pattern as KPITimeFilter for consistency
 */

import { cn } from '@/lib/utils';
import type { MilestoneViewMode } from '@altsui/shared';

interface MilestoneViewToggleProps {
  selected: MilestoneViewMode;
  onChange: (mode: MilestoneViewMode) => void;
  className?: string;
}

interface ViewOption {
  value: MilestoneViewMode;
  label: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'actual', label: 'Actual' },
  { value: 'comparison', label: 'Comparison' },
];

export function MilestoneViewToggle({
  selected,
  onChange,
  className,
}: MilestoneViewToggleProps): JSX.Element {
  return (
    <div className={cn('inline-flex rounded-lg border bg-muted p-1', className)}>
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            selected === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

