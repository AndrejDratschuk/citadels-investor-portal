/**
 * Milestone Form - Create/Edit milestone modal
 */

import { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DealMilestone, MilestoneStatus, MilestoneCategory } from '@altsui/shared';

interface MilestoneFormProps {
  milestone?: DealMilestone;
  onSubmit: (data: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: MilestoneStatus;
    category: MilestoneCategory;
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

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description ?? '');
      setStartDate(milestone.startDate);
      setEndDate(milestone.endDate ?? '');
      setStatus(milestone.status);
      setCategory(milestone.category);
    }
  }, [milestone]);

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
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl">
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

          {/* Dates */}
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
              <p className="text-xs text-muted-foreground mt-1">Leave empty for single-day event</p>
            </div>
          </div>

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

