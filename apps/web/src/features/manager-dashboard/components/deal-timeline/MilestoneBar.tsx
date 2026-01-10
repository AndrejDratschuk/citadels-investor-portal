/**
 * Milestone Bar - Single milestone row in timeline with drag support
 */

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { DealMilestone, MilestoneStatus } from '@altsui/shared';

interface MilestoneBarProps {
  milestone: DealMilestone;
  startMonth: Date;
  totalMonths: number;
  onClick: () => void;
  onDateChange?: (newStartDate: string, newEndDate: string | null) => void;
}

const statusColors: Record<MilestoneStatus, string> = {
  planned: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-orange-500',
};

type DragMode = 'move' | 'resize-start' | 'resize-end' | null;

export function MilestoneBar({
  milestone,
  startMonth,
  totalMonths,
  onClick,
  onDateChange,
}: MilestoneBarProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragOffset, setDragOffset] = useState(0); // In months
  const [widthDelta, setWidthDelta] = useState(0); // In months
  const dragStartX = useRef(0);
  const initialOffset = useRef(0);
  const initialWidth = useRef(0);

  const milestoneStart = new Date(milestone.startDate);
  const milestoneEnd = milestone.endDate ? new Date(milestone.endDate) : milestoneStart;

  // Calculate position
  const startOffset = getMonthDiff(startMonth, milestoneStart);
  const duration = getMonthDiff(milestoneStart, milestoneEnd) + 1;

  // Clamp values
  const left = Math.max(0, startOffset);
  const width = Math.min(duration, totalMonths - left);

  // Apply drag adjustments
  const adjustedLeft = left + (dragMode === 'move' ? dragOffset : dragMode === 'resize-start' ? dragOffset : 0);
  const adjustedWidth = width + (dragMode === 'resize-end' ? widthDelta : dragMode === 'resize-start' ? -dragOffset : 0);
  
  const leftPercent = (Math.max(0, adjustedLeft) / totalMonths) * 100;
  const widthPercent = Math.max((Math.max(1, adjustedWidth) / totalMonths) * 100, 2); // Min 2% width

  const getMonthsFromPixels = useCallback((pixels: number): number => {
    if (!containerRef.current) return 0;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const monthWidth = containerWidth / totalMonths;
    return Math.round(pixels / monthWidth);
  }, [totalMonths]);

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    dragStartX.current = e.clientX;
    initialOffset.current = left;
    initialWidth.current = width;
  }, [left, width]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragMode) return;
    
    const deltaX = e.clientX - dragStartX.current;
    const deltaMonths = getMonthsFromPixels(deltaX);
    
    if (dragMode === 'move') {
      // Clamp so bar stays within bounds
      const newOffset = Math.max(-initialOffset.current, Math.min(deltaMonths, totalMonths - initialOffset.current - initialWidth.current));
      setDragOffset(newOffset);
    } else if (dragMode === 'resize-start') {
      // Can't resize past the end date
      const maxShrink = initialWidth.current - 1;
      const newOffset = Math.max(-initialOffset.current, Math.min(deltaMonths, maxShrink));
      setDragOffset(newOffset);
    } else if (dragMode === 'resize-end') {
      // Can't resize to less than 1 month
      const minDelta = -(initialWidth.current - 1);
      const maxDelta = totalMonths - initialOffset.current - initialWidth.current;
      const newDelta = Math.max(minDelta, Math.min(deltaMonths, maxDelta));
      setWidthDelta(newDelta);
    }
  }, [dragMode, getMonthsFromPixels, totalMonths]);

  const handleMouseUp = useCallback(() => {
    if (!dragMode || !onDateChange) {
      setDragMode(null);
      setDragOffset(0);
      setWidthDelta(0);
      return;
    }

    // Calculate new dates
    const originalStart = new Date(milestone.startDate);
    const originalEnd = milestone.endDate ? new Date(milestone.endDate) : new Date(milestone.startDate);
    
    let newStart = new Date(originalStart);
    let newEnd = new Date(originalEnd);

    if (dragMode === 'move') {
      newStart.setMonth(newStart.getMonth() + dragOffset);
      newEnd.setMonth(newEnd.getMonth() + dragOffset);
    } else if (dragMode === 'resize-start') {
      newStart.setMonth(newStart.getMonth() + dragOffset);
    } else if (dragMode === 'resize-end') {
      newEnd.setMonth(newEnd.getMonth() + widthDelta);
    }

    // Only update if dates actually changed
    if (dragOffset !== 0 || widthDelta !== 0) {
      const newStartStr = formatDateForApi(newStart);
      const newEndStr = milestone.endDate || widthDelta !== 0 ? formatDateForApi(newEnd) : null;
      onDateChange(newStartStr, newEndStr);
    }

    setDragMode(null);
    setDragOffset(0);
    setWidthDelta(0);
  }, [dragMode, dragOffset, widthDelta, milestone.startDate, milestone.endDate, onDateChange]);

  const handleBarClick = useCallback((e: React.MouseEvent) => {
    // Only trigger click if we weren't dragging
    if (!dragMode) {
      onClick();
    }
  }, [dragMode, onClick]);

  return (
    <div 
      ref={containerRef}
      className="group flex items-center gap-3 py-1.5"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Label */}
      <div className="w-40 flex-shrink-0 truncate text-sm font-medium" title={milestone.title}>
        {milestone.title}
      </div>

      {/* Bar Container */}
      <div className="relative flex-1 h-7">
        {/* Bar */}
        <div
          className={cn(
            'absolute top-0 h-full rounded group/bar',
            'hover:brightness-110 hover:shadow-md',
            dragMode ? 'cursor-grabbing shadow-lg' : 'cursor-grab',
            statusColors[milestone.status]
          )}
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            minWidth: '24px',
            transition: dragMode ? 'none' : 'left 0.2s, width 0.2s',
          }}
          title={`${milestone.title}\n${formatDateRange(milestone.startDate, milestone.endDate)}\nDrag to move, drag edges to resize`}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
          onClick={handleBarClick}
        >
          {/* Left resize handle */}
          {onDateChange && (
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l"
              onMouseDown={(e) => handleMouseDown(e, 'resize-start')}
            />
          )}
          
          {/* Show title on wider bars */}
          {widthPercent > 15 && (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-3 pointer-events-none">
              {milestone.title}
            </span>
          )}

          {/* Right resize handle */}
          {onDateChange && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r"
              onMouseDown={(e) => handleMouseDown(e, 'resize-end')}
            />
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

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

