/**
 * Timeline Chart - CSS-based Gantt visualization
 * Supports planned-only, actual-only, and comparison view modes
 */

import { useMemo } from 'react';
import { TimelineHeader } from './TimelineHeader';
import { MilestoneBar } from './MilestoneBar';
import { ComparisonMilestoneBar } from './ComparisonMilestoneBar';
import type { DealMilestone, MilestoneViewMode } from '@altsui/shared';

interface TimelineChartProps {
  milestones: DealMilestone[];
  viewMode: MilestoneViewMode;
  currentDate: string;
  onMilestoneClick: (milestone: DealMilestone) => void;
  onMilestoneDateChange?: (milestoneId: string, startDate: string, endDate: string | null) => void;
}

export function TimelineChart({
  milestones,
  viewMode,
  currentDate,
  onMilestoneClick,
  onMilestoneDateChange,
}: TimelineChartProps): JSX.Element {
  // Calculate date range from milestones (including actual dates for comparison)
  const { startMonth, totalMonths } = useMemo(() => {
    if (milestones.length === 0) {
      const now = new Date(currentDate);
      return {
        startMonth: new Date(now.getFullYear(), now.getMonth(), 1),
        totalMonths: 24,
      };
    }

    let minDate = new Date(milestones[0].startDate);
    let maxDate = new Date(milestones[0].endDate ?? milestones[0].startDate);

    for (const m of milestones) {
      // Always consider planned dates
      const plannedStart = new Date(m.startDate);
      const plannedEnd = new Date(m.endDate ?? m.startDate);

      if (plannedStart < minDate) minDate = plannedStart;
      if (plannedEnd > maxDate) maxDate = plannedEnd;

      // In comparison or actual mode, also consider actual dates
      if (viewMode !== 'planned') {
        if (m.actualStartDate) {
          const actualStart = new Date(m.actualStartDate);
          if (actualStart < minDate) minDate = actualStart;
        }
        if (m.actualCompletionDate) {
          const actualEnd = new Date(m.actualCompletionDate);
          if (actualEnd > maxDate) maxDate = actualEnd;
        }
      }
    }

    // Add 2 months padding on each side
    const startMonth = new Date(minDate.getFullYear(), minDate.getMonth() - 2, 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 3, 1);

    const totalMonths = Math.max(
      12,
      (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
        (endMonth.getMonth() - startMonth.getMonth())
    );

    return { startMonth, totalMonths };
  }, [milestones, viewMode, currentDate]);

  // Sort milestones by start date and then by sort order
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.sortOrder - b.sortOrder;
    });
  }, [milestones]);

  // Adjust grid offset based on view mode (comparison needs more label space)
  const gridMarginLeft = viewMode === 'comparison' ? 'ml-56' : 'ml-40';

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with months/years */}
        <div className={gridMarginLeft}>
          <TimelineHeader startMonth={startMonth} totalMonths={totalMonths} />
        </div>

        {/* Grid background */}
        <div className="relative">
          {/* Vertical grid lines */}
          <div
            className={`absolute inset-0 ${gridMarginLeft} flex pointer-events-none`}
            style={{ zIndex: 0 }}
          >
            {Array.from({ length: totalMonths }).map((_, i) => (
              <div
                key={i}
                className="border-l border-border/30 h-full"
                style={{ width: `${(1 / totalMonths) * 100}%` }}
              />
            ))}
          </div>

          {/* Milestone bars */}
          <div className="relative py-2" style={{ zIndex: 1 }}>
            {sortedMilestones.map((milestone) => {
              if (viewMode === 'comparison') {
                return (
                  <ComparisonMilestoneBar
                    key={milestone.id}
                    milestone={milestone}
                    startMonth={startMonth}
                    totalMonths={totalMonths}
                    currentDate={currentDate}
                    onClick={() => onMilestoneClick(milestone)}
                  />
                );
              }

              // For planned or actual view, use the standard bar
              // but with appropriate dates based on viewMode
              const displayMilestone = viewMode === 'actual' && milestone.actualStartDate
                ? {
                    ...milestone,
                    startDate: milestone.actualStartDate,
                    endDate: milestone.actualCompletionDate,
                  }
                : milestone;

              return (
                <MilestoneBar
                  key={milestone.id}
                  milestone={displayMilestone}
                  startMonth={startMonth}
                  totalMonths={totalMonths}
                  onClick={() => onMilestoneClick(milestone)}
                  onDateChange={
                    onMilestoneDateChange
                      ? (startDate, endDate) =>
                          onMilestoneDateChange(milestone.id, startDate, endDate)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
