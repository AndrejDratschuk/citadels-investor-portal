/**
 * Comparison Milestone Bar - Stacked planned/actual bars with variance display
 * Shows side-by-side comparison of planned vs actual timelines
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { DealMilestone, MilestoneVarianceStatus } from '@altsui/shared';
import { calculateMilestoneVariance, isMilestoneInProgress } from '@altsui/shared';

interface ComparisonMilestoneBarProps {
  milestone: DealMilestone;
  startMonth: Date;
  totalMonths: number;
  currentDate: string;
  onClick: () => void;
}

// Color mapping for variance status
const varianceColors: Record<MilestoneVarianceStatus, { bar: string; badge: string }> = {
  ahead: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  on_track: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  slight_delay: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  major_delay: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  not_started: { bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-600' },
};

// Planned bar is always a subtle gray
const plannedBarColor = 'bg-slate-400';

export function ComparisonMilestoneBar({
  milestone,
  startMonth,
  totalMonths,
  currentDate,
  onClick,
}: ComparisonMilestoneBarProps): JSX.Element {
  // Calculate variance
  const variance = useMemo(
    () => calculateMilestoneVariance(milestone, currentDate),
    [milestone, currentDate]
  );

  // Calculate planned bar position
  const plannedStart = new Date(milestone.startDate);
  const plannedEnd = milestone.endDate ? new Date(milestone.endDate) : plannedStart;
  
  const plannedStartOffset = getMonthDiff(startMonth, plannedStart);
  const plannedDuration = getMonthDiff(plannedStart, plannedEnd) + 1;
  
  const plannedLeft = Math.max(0, plannedStartOffset);
  const plannedWidth = Math.min(plannedDuration, totalMonths - plannedLeft);
  const plannedLeftPercent = (plannedLeft / totalMonths) * 100;
  const plannedWidthPercent = Math.max((plannedWidth / totalMonths) * 100, 2);

  // Calculate actual bar position
  const actualStart = milestone.actualStartDate 
    ? new Date(milestone.actualStartDate) 
    : plannedStart;
  const actualEnd = milestone.actualCompletionDate
    ? new Date(milestone.actualCompletionDate)
    : isMilestoneInProgress(milestone)
    ? new Date(currentDate)
    : plannedEnd;

  const actualStartOffset = getMonthDiff(startMonth, actualStart);
  const actualDuration = getMonthDiff(actualStart, actualEnd) + 1;
  
  const actualLeft = Math.max(0, actualStartOffset);
  const actualWidth = Math.min(actualDuration, totalMonths - actualLeft);
  const actualLeftPercent = (actualLeft / totalMonths) * 100;
  const actualWidthPercent = Math.max((actualWidth / totalMonths) * 100, 2);

  const colors = varianceColors[variance.status];
  const isInProgress = isMilestoneInProgress(milestone);

  return (
    <div className="group py-1.5">
      {/* Row 1: Title + Planned Bar */}
      <div className="flex items-center gap-3">
        {/* Label column with title */}
        <div className="w-56 flex-shrink-0 flex items-center gap-2">
          <span className="text-sm font-medium truncate flex-1" title={milestone.title}>
            {milestone.title}
          </span>
          <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
            Planned
          </span>
        </div>

        {/* Planned Bar */}
        <div className="relative flex-1 h-5">
          <div
            className={cn(
              'absolute top-0 h-full rounded cursor-pointer',
              'hover:brightness-110 transition-all',
              plannedBarColor
            )}
            style={{
              left: `${plannedLeftPercent}%`,
              width: `${plannedWidthPercent}%`,
              minWidth: '16px',
            }}
            title={`Planned: ${formatDateRange(milestone.startDate, milestone.endDate)}`}
            onClick={onClick}
          />
        </div>
      </div>

      {/* Row 2: Variance Badge + Actual Bar */}
      <div className="flex items-center gap-3 mt-0.5">
        {/* Label column with variance badge */}
        <div className="w-56 flex-shrink-0 flex items-center gap-2">
          <div className="flex-1">
            {variance.hasActualData && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  colors.badge
                )}
              >
                {variance.display}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">
            Actual
          </span>
        </div>

        {/* Actual Bar */}
        <div className="relative flex-1 h-5">
          {variance.hasActualData ? (
            <div
              className={cn(
                'absolute top-0 h-full rounded cursor-pointer',
                'hover:brightness-110 transition-all',
                colors.bar,
                isInProgress && 'bg-opacity-70'
              )}
              style={{
                left: `${actualLeftPercent}%`,
                width: `${actualWidthPercent}%`,
                minWidth: '16px',
                ...(isInProgress && {
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 4px,
                    rgba(255,255,255,0.3) 4px,
                    rgba(255,255,255,0.3) 8px
                  )`,
                }),
              }}
              title={`Actual: ${formatDateRange(
                milestone.actualStartDate ?? milestone.startDate,
                milestone.actualCompletionDate
              )}${isInProgress ? ' (in progress)' : ''}`}
              onClick={onClick}
            />
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Not started
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getMonthDiff(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function formatDateRange(start: string, end: string | null): string {
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);

  if (!end) return startStr;

  const endDate = new Date(end);
  const endStr = endDate.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
}
