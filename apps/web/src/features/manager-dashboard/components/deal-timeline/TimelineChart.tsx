/**
 * Timeline Chart - CSS-based Gantt visualization
 */

import { useMemo } from 'react';
import { TimelineHeader } from './TimelineHeader';
import { MilestoneBar } from './MilestoneBar';
import type { DealMilestone } from '@altsui/shared';

interface TimelineChartProps {
  milestones: DealMilestone[];
  onMilestoneClick: (milestone: DealMilestone) => void;
  onMilestoneDateChange?: (milestoneId: string, startDate: string, endDate: string | null) => void;
}

export function TimelineChart({ milestones, onMilestoneClick, onMilestoneDateChange }: TimelineChartProps): JSX.Element {
  // Calculate date range from milestones
  const { startMonth, totalMonths } = useMemo(() => {
    if (milestones.length === 0) {
      // Default: current month + 24 months
      const now = new Date();
      return {
        startMonth: new Date(now.getFullYear(), now.getMonth(), 1),
        totalMonths: 24,
      };
    }

    let minDate = new Date(milestones[0].startDate);
    let maxDate = new Date(milestones[0].endDate || milestones[0].startDate);

    for (const m of milestones) {
      const start = new Date(m.startDate);
      const end = new Date(m.endDate || m.startDate);

      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
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
  }, [milestones]);

  // Sort milestones by start date and then by category
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.sortOrder - b.sortOrder;
    });
  }, [milestones]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with months/years */}
        <TimelineHeader startMonth={startMonth} totalMonths={totalMonths} />

        {/* Grid background */}
        <div className="relative">
          {/* Vertical grid lines */}
          <div
            className="absolute inset-0 ml-40 flex pointer-events-none"
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
            {sortedMilestones.map((milestone) => (
              <MilestoneBar
                key={milestone.id}
                milestone={milestone}
                startMonth={startMonth}
                totalMonths={totalMonths}
                onClick={() => onMilestoneClick(milestone)}
                onDateChange={onMilestoneDateChange 
                  ? (startDate, endDate) => onMilestoneDateChange(milestone.id, startDate, endDate)
                  : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

