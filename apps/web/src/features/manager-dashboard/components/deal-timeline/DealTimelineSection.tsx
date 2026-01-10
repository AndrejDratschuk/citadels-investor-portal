/**
 * Deal Timeline Section - Container with chart + form
 */

import { useState } from 'react';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineChart } from './TimelineChart';
import { MilestoneForm } from './MilestoneForm';
import { StatusBadge } from './StatusBadge';
import {
  useDealMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '../../hooks/useDealNotes';
import type { DealMilestone, MilestoneStatus, MilestoneCategory } from '@altsui/shared';

interface DealTimelineSectionProps {
  dealId: string;
}

export function DealTimelineSection({ dealId }: DealTimelineSectionProps): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<DealMilestone | null>(null);

  const { data, isLoading } = useDealMilestones(dealId);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone(dealId);
  const deleteMilestone = useDeleteMilestone(dealId);

  const handleCreate = (formData: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status: MilestoneStatus;
    category: MilestoneCategory;
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

  const handleDelete = (): void => {
    if (!editingMilestone) return;
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      deleteMilestone.mutate(editingMilestone.id, {
        onSuccess: () => {
          setEditingMilestone(null);
        },
      });
    }
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Deal Timeline</h3>
          <p className="text-sm text-muted-foreground">
            Plan and track milestones throughout the deal lifecycle
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>
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
            onMilestoneClick={setEditingMilestone}
            onMilestoneDateChange={handleDateChange}
          />

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-xs">
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
          </div>
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

