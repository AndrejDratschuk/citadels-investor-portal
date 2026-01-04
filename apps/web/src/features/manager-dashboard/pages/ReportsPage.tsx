import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  Wallet,
  PiggyBank,
  Home,
  Percent,
  Download,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '../components/StatsCard';
import { FundChart } from '../components/FundChart';
import { DealSelector } from '../components/reports';
import { reportsApi } from '@/lib/api/reports';

export function ReportsPage() {
  // Track selected deals (default: all deals selected)
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Fetch fund metrics
  const {
    data: fundMetrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['fund-metrics'],
    queryFn: reportsApi.getFundMetrics,
  });

  // Fetch deal summaries for selector
  const { data: dealSummaries, isLoading: isDealsLoading } = useQuery({
    queryKey: ['deal-summaries'],
    queryFn: reportsApi.getDealSummaries,
  });

  // Auto-select all deals when summaries load
  useEffect(() => {
    if (dealSummaries && dealSummaries.length > 0 && selectedDealIds.length === 0) {
      setSelectedDealIds(dealSummaries.map((d) => d.id));
    }
  }, [dealSummaries, selectedDealIds.length]);

  // Fetch deal rollups based on selection
  const {
    data: dealRollup,
    isLoading: isRollupLoading,
    refetch: refetchRollup,
  } = useQuery({
    queryKey: ['deal-rollup', selectedDealIds],
    queryFn: () => reportsApi.getDealRollups(selectedDealIds),
    enabled: selectedDealIds.length > 0,
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchRollup();
  };

  // Build chart data for portfolio allocation
  const portfolioChartData = dealSummaries
    ?.filter((d) => selectedDealIds.includes(d.id) && d.currentValue)
    .map((d) => ({
      label: d.name,
      value: d.currentValue || 0,
    })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fund Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of fund metrics and aggregated deal performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled title="Export coming soon">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Fund-Level Metrics Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Fund Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isMetricsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-32" />
              </div>
            ))
          ) : fundMetrics ? (
            <>
              <StatsCard
                title="Assets Under Management"
                value={formatCurrency(fundMetrics.aum)}
                icon={DollarSign}
                description="Total portfolio value"
              />
              <StatsCard
                title="Net Asset Value"
                value={formatCurrency(fundMetrics.nav)}
                icon={TrendingUp}
                description="AUM minus liabilities"
              />
              <StatsCard
                title="Total Commitments"
                value={formatCurrency(fundMetrics.totalCommitments)}
                icon={Wallet}
                description={`From ${fundMetrics.investorCount} investors`}
              />
              <StatsCard
                title="Capital Deployed"
                value={formatCurrency(fundMetrics.capitalDeployed)}
                icon={PiggyBank}
                description={formatCurrency(fundMetrics.uncommittedCapital) + ' uncommitted'}
              />
            </>
          ) : null}
        </div>

        {/* Secondary metrics row */}
        {!isMetricsLoading && fundMetrics && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatsCard
              title="Active Deals"
              value={fundMetrics.dealCount}
              icon={Building2}
              description="Properties in portfolio"
            />
            <StatsCard
              title="Total Investors"
              value={fundMetrics.investorCount}
              icon={Users}
              description={`${fundMetrics.activeInvestorCount} active`}
            />
            <StatsCard
              title="Deployment Rate"
              value={fundMetrics.totalCommitments > 0
                ? formatPercentage(fundMetrics.capitalDeployed / fundMetrics.totalCommitments)
                : '0%'}
              icon={Percent}
              description="Capital deployed / committed"
            />
          </div>
        )}
      </section>

      {/* Deal Selection & Rollups Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deal Roll-ups</h2>
          <DealSelector
            deals={dealSummaries || []}
            selectedDealIds={selectedDealIds}
            onSelectionChange={setSelectedDealIds}
            isLoading={isDealsLoading}
          />
        </div>

        {/* Rollup Metrics */}
        {selectedDealIds.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Deals Selected</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select one or more deals above to see aggregated metrics
            </p>
          </div>
        ) : isRollupLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-32" />
              </div>
            ))}
          </div>
        ) : dealRollup ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Current Value"
                value={formatCurrency(dealRollup.totalCurrentValue)}
                icon={DollarSign}
                description={`${dealRollup.dealCount} deal${dealRollup.dealCount !== 1 ? 's' : ''} selected`}
              />
              <StatsCard
                title="Total Acquisition Cost"
                value={formatCurrency(dealRollup.totalAcquisitionCost)}
                icon={Wallet}
                description="Original investment"
              />
              <StatsCard
                title="Total Appreciation"
                value={formatCurrency(dealRollup.totalAppreciation)}
                icon={TrendingUp}
                trend={dealRollup.appreciationPercent !== 0 ? {
                  value: Math.round(dealRollup.appreciationPercent),
                  isPositive: dealRollup.appreciationPercent > 0,
                } : undefined}
                description="Value gain since acquisition"
              />
              <StatsCard
                title="Total NOI"
                value={formatCurrency(dealRollup.totalNoi)}
                icon={PiggyBank}
                description="Net Operating Income"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Units"
                value={dealRollup.totalUnits.toLocaleString()}
                icon={Building2}
                description="Across all selected deals"
              />
              <StatsCard
                title="Total Sq Ft"
                value={dealRollup.totalSqFt.toLocaleString()}
                icon={Home}
                description="Total square footage"
              />
              <StatsCard
                title="Average Occupancy"
                value={dealRollup.avgOccupancy > 0 
                  ? formatPercentage(dealRollup.avgOccupancy)
                  : 'N/A'}
                icon={Users}
                description="Weighted by unit count"
              />
              <StatsCard
                title="Weighted Cap Rate"
                value={dealRollup.weightedCapRate > 0
                  ? formatPercentage(dealRollup.weightedCapRate)
                  : 'N/A'}
                icon={Percent}
                description="Weighted by value"
              />
            </div>
          </>
        ) : null}
      </section>

      {/* Portfolio Allocation Chart */}
      {portfolioChartData.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Portfolio Allocation</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <FundChart
              title="Value by Deal"
              data={portfolioChartData}
              type="bar"
            />
            <FundChart
              title="Portfolio Distribution"
              data={portfolioChartData}
              type="donut"
            />
          </div>
        </section>
      )}
    </div>
  );
}

