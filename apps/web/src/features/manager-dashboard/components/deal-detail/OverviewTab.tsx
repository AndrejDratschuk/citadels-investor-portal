import { formatCurrency, formatDate } from '@altsui/shared';
import { DealNotesSection } from '../deal-notes';
import type { DealWithKpis } from './dealDetailMockData';

interface OverviewTabProps {
  deal: DealWithKpis;
  dealId?: string;
}

function calculateRenovationProgress(spent: number, budget: number): number {
  return (spent / budget) * 100;
}

export function OverviewTab({ deal, dealId }: OverviewTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Property Details & Renovation Progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold">Property Details</h3>
          <p className="mt-3 text-muted-foreground">{deal.description}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Acquisition Date</span>
              <span>{deal.acquisitionDate ? formatDate(deal.acquisitionDate) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Acquisition Price</span>
              <span>{deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Investment</span>
              <span>{deal.totalInvestment ? formatCurrency(deal.totalInvestment) : '—'}</span>
            </div>
          </div>
        </div>

        {deal.kpis?.renovationBudget && deal.kpis?.renovationSpent !== undefined && (
          <RenovationProgressCard
            budget={deal.kpis.renovationBudget}
            spent={deal.kpis.renovationSpent}
          />
        )}
      </div>

      {/* Deal Notes */}
      {dealId && <DealNotesSection dealId={dealId} />}
    </div>
  );
}

interface RenovationProgressCardProps {
  budget: number;
  spent: number;
}

function RenovationProgressCard({ budget, spent }: RenovationProgressCardProps): JSX.Element {
  const progress = calculateRenovationProgress(spent, budget);

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold">Renovation Progress</h3>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Budget Used</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>{formatCurrency(spent)}</span>
          <span className="text-muted-foreground">of {formatCurrency(budget)}</span>
        </div>
      </div>
    </div>
  );
}
