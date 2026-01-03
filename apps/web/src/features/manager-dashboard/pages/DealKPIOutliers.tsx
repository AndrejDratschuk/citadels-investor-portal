/**
 * Deal KPI Outliers Page (Level 3)
 * Displays KPIs that are significantly above or below their baselines
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { outliersApi } from '@/lib/api/kpis';
import { dealsApi } from '@/lib/api/deals';
import { KPICategoryNav, OutlierCard } from '../components/kpi';
import type { KpiCategoryNavOption } from '../components/kpi';
import type { KpiCategory } from '@altsui/shared';

// ============================================
// Component
// ============================================
export function DealKPIOutliers(): JSX.Element {
  const { id: dealId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCategory] = useState<KpiCategoryNavOption>('outliers');

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch outliers
  const { data: outliers, isLoading: isOutliersLoading } = useQuery({
    queryKey: ['deal-outliers', dealId],
    queryFn: () => outliersApi.getOutliers(dealId!, { topCount: 5 }),
    enabled: !!dealId,
  });

  const isLoading = isDealLoading || isOutliersLoading;
  const hasTopPerformers = (outliers?.topPerformers?.length ?? 0) > 0;
  const hasBottomPerformers = (outliers?.bottomPerformers?.length ?? 0) > 0;
  const hasAnyOutliers = hasTopPerformers || hasBottomPerformers;

  // Handle category navigation
  const handleCategoryChange = (category: KpiCategoryNavOption): void => {
    if (category === 'outliers') {
      return; // Already on outliers
    } else if (category === 'all') {
      navigate(`/manager/deals/${dealId}/financials`);
    } else {
      navigate(`/manager/deals/${dealId}/financials/category/${category}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={`/manager/deals/${dealId}/financials`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Financials
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Outliers & Exceptions</h1>
            {deal && (
              <p className="text-sm text-muted-foreground">{deal.name}</p>
            )}
          </div>
        </div>
        {outliers?.lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Last updated:{' '}
            {new Date(outliers.lastUpdated).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {/* Category Navigation */}
      <KPICategoryNav
        selected={selectedCategory}
        onChange={handleCategoryChange}
        showOutliers={true}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((section) => (
            <div key={section} className="rounded-xl border bg-card p-5 shadow-sm">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasAnyOutliers && (
        <div className="rounded-xl border bg-card p-10 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Outliers Detected</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            All metrics are performing within expected ranges. This is good news!
            Continue monitoring for any future variances.
          </p>
        </div>
      )}

      {/* Outliers Dumbbell Layout */}
      {!isLoading && hasAnyOutliers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 bg-emerald-50 border-b border-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-emerald-800">Top Performers</h2>
              <span className="ml-auto text-sm text-emerald-600 font-medium">
                Exceeding Targets
              </span>
            </div>
            <div className="p-4 space-y-4">
              {hasTopPerformers ? (
                outliers!.topPerformers.map((outlier, index) => (
                  <OutlierCard
                    key={outlier.kpiId}
                    outlier={outlier}
                    dealId={dealId!}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No top performers detected</p>
                  <p className="text-xs mt-1">
                    No KPIs are exceeding their targets by the configured threshold
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Performers Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 bg-red-50 border-b border-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-red-800">Bottom Performers</h2>
              <span className="ml-auto text-sm text-red-600 font-medium">
                Missing Targets
              </span>
            </div>
            <div className="p-4 space-y-4">
              {hasBottomPerformers ? (
                outliers!.bottomPerformers.map((outlier, index) => (
                  <OutlierCard
                    key={outlier.kpiId}
                    outlier={outlier}
                    dealId={dealId!}
                    rank={index + 1}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No bottom performers detected</p>
                  <p className="text-xs mt-1">
                    No KPIs are missing their targets by the configured threshold
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      {!isLoading && hasAnyOutliers && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>About Outliers:</strong> KPIs shown here have a variance of 20% or more 
            from their baseline (forecast, budget, or prior period). Configure thresholds and 
            baselines in{' '}
            <Link
              to="/manager/settings/kpis"
              className="text-primary hover:underline font-medium"
            >
              KPI Settings
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default DealKPIOutliers;

