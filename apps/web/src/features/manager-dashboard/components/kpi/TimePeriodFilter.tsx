/**
 * Time Period Filter Component
 * Allows filtering KPI data by date range with preset options and custom picker
 */

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
export type TimePeriodPreset = '30d' | '90d' | '12m' | 'ytd' | 'custom';

export interface DateRange {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
}

interface TimePeriodFilterProps {
  selected: TimePeriodPreset;
  customRange?: DateRange;
  onChange: (preset: TimePeriodPreset, range: DateRange) => void;
  className?: string;
}

// ============================================
// Pure Date Calculation Functions
// ============================================

/** Calculate date range from preset (deterministic - requires currentDate) */
export function getDateRangeFromPreset(
  preset: TimePeriodPreset,
  currentDate: Date,
  customRange?: DateRange
): DateRange {
  const endDate = formatDateISO(currentDate);

  switch (preset) {
    case '30d': {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - 30);
      return { startDate: formatDateISO(start), endDate };
    }
    case '90d': {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - 90);
      return { startDate: formatDateISO(start), endDate };
    }
    case '12m': {
      const start = new Date(currentDate);
      start.setFullYear(start.getFullYear() - 1);
      return { startDate: formatDateISO(start), endDate };
    }
    case 'ytd': {
      const start = new Date(currentDate.getFullYear(), 0, 1);
      return { startDate: formatDateISO(start), endDate };
    }
    case 'custom': {
      if (customRange) {
        return customRange;
      }
      // Fallback to last 30 days if no custom range
      const start = new Date(currentDate);
      start.setDate(start.getDate() - 30);
      return { startDate: formatDateISO(start), endDate };
    }
  }
}

/** Format Date to ISO string (YYYY-MM-DD) */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Parse ISO date string to display format */
function formatDateDisplay(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// Preset Configuration
// ============================================
interface PresetConfig {
  value: TimePeriodPreset;
  label: string;
}

const PRESETS: PresetConfig[] = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: '12mo' },
  { value: 'ytd', label: 'YTD' },
  { value: 'custom', label: 'Custom' },
];

// ============================================
// Component
// ============================================
export function TimePeriodFilter({
  selected,
  customRange,
  onChange,
  className,
}: TimePeriodFilterProps): JSX.Element {
  const [showCustomPicker, setShowCustomPicker] = useState(selected === 'custom');
  const [localStartDate, setLocalStartDate] = useState(customRange?.startDate ?? '');
  const [localEndDate, setLocalEndDate] = useState(customRange?.endDate ?? '');

  const handlePresetClick = (preset: TimePeriodPreset): void => {
    if (preset === 'custom') {
      setShowCustomPicker(true);
      // If custom range exists, use it; otherwise calculate default
      const range = customRange ?? getDateRangeFromPreset('30d', new Date());
      setLocalStartDate(range.startDate);
      setLocalEndDate(range.endDate);
      onChange(preset, range);
    } else {
      setShowCustomPicker(false);
      const range = getDateRangeFromPreset(preset, new Date());
      onChange(preset, range);
    }
  };

  const handleCustomDateChange = (
    type: 'start' | 'end',
    value: string
  ): void => {
    if (type === 'start') {
      setLocalStartDate(value);
      if (value && localEndDate) {
        onChange('custom', { startDate: value, endDate: localEndDate });
      }
    } else {
      setLocalEndDate(value);
      if (localStartDate && value) {
        onChange('custom', { startDate: localStartDate, endDate: value });
      }
    }
  };

  // Calculate display range for the badge
  const currentRange = selected === 'custom' && customRange
    ? customRange
    : getDateRangeFromPreset(selected, new Date(), customRange);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1">
        {/* Preset Buttons */}
        <div className="inline-flex rounded-lg border bg-muted p-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                selected === preset.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Range Badge */}
        <span className="ml-2 text-xs text-muted-foreground">
          {formatDateDisplay(currentRange.startDate)} – {formatDateDisplay(currentRange.endDate)}
        </span>
      </div>

      {/* Custom Date Picker (expandable) */}
      {showCustomPicker && selected === 'custom' && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={localStartDate}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
            max={localEndDate || undefined}
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={localEndDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
            min={localStartDate || undefined}
          />
        </div>
      )}
    </div>
  );
}

export default TimePeriodFilter;

