/**
 * Milestone Form - Create/Edit milestone modal with actual dates support
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DealMilestone, MilestoneStatus, MilestoneCategory, MilestoneVarianceStatus } from '@altsui/shared';
import { calculateMilestoneVariance } from '@altsui/shared';

interface MilestoneFormProps {
  milestone?: DealMilestone;
  onSubmit: (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: MilestoneStatus;
    category: MilestoneCategory;
    actualStartDate?: string | null;
    actualCompletionDate?: string | null;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
];

const CATEGORY_OPTIONS: { value: MilestoneCategory; label: string }[] = [
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'financing', label: 'Financing' },
  { value: 'operations', label: 'Operations' },
  { value: 'disposition', label: 'Disposition' },
  { value: 'other', label: 'Other' },
];

const varianceStyles: Record<MilestoneVarianceStatus, { bg: string; text: string; icon: typeof TrendingUp }> = {
  ahead: { bg: 'bg-green-100', text: 'text-green-700', icon: TrendingUp },
  on_track: { bg: 'bg-green-100', text: 'text-green-700', icon: Clock },
  slight_delay: { bg: 'bg-amber-100', text: 'text-amber-700', icon: TrendingDown },
  major_delay: { bg: 'bg-red-100', text: 'text-red-700', icon: TrendingDown },
  not_started: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Clock },
};

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function MilestoneForm({
  milestone,
  onSubmit,
  onCancel,
  isSubmitting,
}: MilestoneFormProps): JSX.Element {
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [startDate, setStartDate] = useState(milestone?.startDate ?? '');
  const [endDate, setEndDate] = useState(milestone?.endDate ?? '');
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status ?? 'planned');
  const [category, setCategory] = useState<MilestoneCategory>(milestone?.category ?? 'other');
  const [actualStartDate, setActualStartDate] = useState(milestone?.actualStartDate ?? '');
  const [actualEndDate, setActualEndDate] = useState(milestone?.actualCompletionDate ?? '');

  // Track previous status for auto-population
  const [prevStatus, setPrevStatus] = useState<MilestoneStatus | null>(null);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? '');
      setStartDate(milestone.startDate);
      setEndDate(milestone.endDate ?? '');
      setStatus(milestone.status);
      setCategory(milestone.category);
      setActualStartDate(milestone.actualStartDate ?? '');
      setActualEndDate(milestone.actualCompletionDate ?? '');
      setPrevStatus(milestone.status);
    }
  }, [milestone]);

  // Auto-populate actual dates when status changes
  useEffect(() => {
    if (prevStatus === null) return;

    const today = getTodayString();

    // When changing to "In Progress", suggest actual start date
    if (status === 'in_progress' && prevStatus !== 'in_progress' && !actualStartDate) {
      setActualStartDate(today);
    }

    // When changing to "Completed", suggest actual end date
    if (status === 'completed' && prevStatus !== 'completed' && !actualEndDate) {
      setActualEndDate(today);
      // Also set actual start if not set
      if (!actualStartDate) {
        setActualStartDate(startDate || today);
      }
    }

    setPrevStatus(status);
  }, [status, prevStatus, actualStartDate, actualEndDate, startDate]);

  // Calculate variance for display
  const variance = useMemo(() => {
    if (!startDate) return null;

    const mockMilestone: DealMilestone = {
      id: '',
      dealId: '',
      fundId: '',
      title,
      description: description || null,
      startDate,
      endDate: endDate || null,
      status,
      category,
      actualStartDate: actualStartDate || null,
      actualCompletionDate: actualEndDate || null,
      sortOrder: 0,
      createdBy: null,
      createdAt: '',
      updatedAt: '',
    };

    return calculateMilestoneVariance(mockMilestone, getTodayString());
  }, [title, description, startDate, endDate, status, category, actualStartDate, actualEndDate]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (title.trim() && startDate) {
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        status,
        category,
        actualStartDate: actualStartDate || null,
        actualCompletionDate: actualEndDate || null,
      });
    }
  };

  const showActualDates = milestone !== undefined || status !== 'planned';
  const variantStyle = variance ? varianceStyles[variance.status] : null;
  const VarianceIcon = variantStyle?.icon ?? Clock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">
            {milestone ? 'Edit Milestone' : 'Add Milestone'}
          </h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Pool Renovation"
              className="mt-1.5"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
            />
          </div>

          {/* Planned Dates Section */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Planned (Original)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5"
                  min={startDate}
                />
              </div>
            </div>
          </div>

          {/* Actual Dates Section - Only show when editing or status is not planned */}
          {showActualDates && (
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Actual</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actualStartDate">Start Date</Label>
                  <Input
                    id="actualStartDate"
                    type="date"
                    value={actualStartDate}
                    onChange={(e) => setActualStartDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="actualEndDate">
                    {status === 'completed' ? 'Completion Date' : 'Expected End'}
                  </Label>
                  <Input
                    id="actualEndDate"
                    type="date"
                    value={actualEndDate}
                    onChange={(e) => setActualEndDate(e.target.value)}
                    className="mt-1.5"
                    min={actualStartDate || undefined}
                  />
                </div>
              </div>

              {/* Variance Display */}
              {variance && variance.hasActualData && variantStyle && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-md p-2 mt-2',
                    variantStyle.bg
                  )}
                >
                  <VarianceIcon className={cn('h-4 w-4', variantStyle.text)} />
                  <span className={cn('text-sm font-medium', variantStyle.text)}>
                    {variance.display}
                  </span>
                  {variance.variancePercent !== 0 && (
                    <span className={cn('text-xs', variantStyle.text)}>
                      ({variance.variancePercent > 0 ? '+' : ''}
                      {variance.variancePercent.toFixed(0)}% of planned duration)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as MilestoneCategory)}
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !startDate}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {milestone ? 'Update' : 'Add'} Milestone
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
