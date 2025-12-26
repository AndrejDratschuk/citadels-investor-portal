import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { OnboardingStats as StatsType } from './types';

interface OnboardingStatsProps {
  stats: StatsType;
}

export function OnboardingStats({ stats }: OnboardingStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.rejected}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

