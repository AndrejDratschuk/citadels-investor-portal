/**
 * Deal Timeline Section - Container with chart + form
 * Supports planned, actual, and comparison view modes
 */

import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineChart } from './TimelineChart';
import { MilestoneForm } from './MilestoneForm';
import { MilestoneViewToggle } from './MilestoneViewToggle';
import { StatusBadge } from './StatusBadge';
import {
  useDealMilestones,
  useCreateMilestone,
  useUpdateMilestone,
} from '../../hooks/useDealNotes';
import type { DealMilestone, MilestoneStatus, MilestoneCategory, MilestoneViewMode } from '@altsui/shared';

interface DealTimelineSectionProps {
  dealId: string;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function DealTimelineSection({ dealId }: DealTimelineSectionProps): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<DealMilestone | null>(null);
  const [viewMode, setViewMode] = useState<MilestoneViewMode>('planned');

  const { data, isLoading } = useDealMilestones(dealId);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone(dealId);

  const handleCreate = (formData: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: MilestoneStatus;
    category: MilestoneCategory;
    actualStartDate?: string | null;
    actualCompletionDate?: string | null;
  }): void => {
    createMilestone.mutate(
      { dealId, ...formData },
      {
        onSuccess: () => {
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdate = (formData: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: MilestoneStatus;
    category: MilestoneCategory;
    actualStartDate?: string | null;
    actualCompletionDate?: string | null;
  }): void => {
    if (!editingMilestone) return;
    updateMilestone.mutate(
      { milestoneId: editingMilestone.id, input: formData },
      {
        onSuccess: () => {
          setEditingMilestone(null);
        },
      }
    );
  };

  const handleDateChange = (milestoneId: string, startDate: string, endDate: string | null): void => {
    updateMilestone.mutate(
      { milestoneId, input: { startDate, endDate } },
    );
  };

  const milestones = data?.milestones ?? [];

  // Status summary
  const statusCounts = milestones.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    },
    {} as Record<MilestoneStatus, number>
  );

  // Check if any milestones have actual data (for showing comparison option hint)
  const hasActualData = milestones.some(m => m.actualStartDate || m.actualCompletionDate);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold">Deal Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Plan and track milestones throughout the deal lifecycle
          </p>
        </div>
        <div className="flex items-center gap-3">
          {milestones.length > 0 && (
            <MilestoneViewToggle
              selected={viewMode}
              onChange={setViewMode}
            />
          )}
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      {milestones.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <StatusBadge status={status as MilestoneStatus} />
              <span className="text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-xl border bg-card p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 flex-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      {!isLoading && milestones.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <TimelineChart
            milestones={milestones}
            viewMode={viewMode}
            currentDate={getTodayString()}
            onMilestoneClick={setEditingMilestone}
            onMilestoneDateChange={handleDateChange}
          />

          {/* Legend - different based on view mode */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
            {viewMode === 'comparison' ? (
              <>
                <span className="text-muted-foreground">Variance:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-green-500" />
                  <span>Ahead / On Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-amber-500" />
                  <span>Slight Delay (1-20%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  <span>Major Delay ({'>'}20%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-slate-300" />
                  <span>Not Started</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-slate-400" />
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-blue-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-green-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded bg-orange-500" />
                  <span>Delayed</span>
                </div>
              </>
            )}
          </div>

          {/* Hint for comparison mode when no actual data */}
          {viewMode === 'comparison' && !hasActualData && (
            <p className="mt-2 text-xs text-muted-foreground italic">
              No actual dates recorded yet. Edit milestones to add actual start/end dates for comparison.
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && milestones.length === 0 && (
        <div className="rounded-xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="mt-4 font-medium">No milestones yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a timeline to track key events and phases of this deal
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add First Milestone
          </Button>
        </div>
      )}

      {/* Form Modal - Create */}
      {showForm && (
        <MilestoneForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isSubmitting={createMilestone.isPending}
        />
      )}

      {/* Form Modal - Edit */}
      {editingMilestone && (
        <MilestoneForm
          milestone={editingMilestone}
          onSubmit={handleUpdate}
          onCancel={() => setEditingMilestone(null)}
          isSubmitting={updateMilestone.isPending}
        />
      )}
    </div>
  );
}
