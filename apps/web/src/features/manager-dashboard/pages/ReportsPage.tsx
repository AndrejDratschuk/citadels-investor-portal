import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  Wallet,
  PiggyBank,
  Percent,
  Download,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DealSelector,
  MetricCard,
  PortfolioChart,
  GaugeChart,
  exportReport,
  type ExportFormat,
} from '../components/reports';
import { reportsApi } from '@/lib/api/reports';

export function ReportsPage() {
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: fundMetrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['fund-metrics'],
    queryFn: reportsApi.getFundMetrics,
  });

  const { data: dealSummaries, isLoading: isDealsLoading } = useQuery({
    queryKey: ['deal-summaries'],
    queryFn: reportsApi.getDealSummaries,
  });

  useEffect(() => {
    if (dealSummaries && dealSummaries.length > 0 && selectedDealIds.length === 0) {
      setSelectedDealIds(dealSummaries.map((d) => d.id));
    }
  }, [dealSummaries, selectedDealIds.length]);

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

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      const selectedDeals = dealSummaries?.filter((d) => selectedDealIds.includes(d.id)) || [];
      await exportReport(format, {
        fundMetrics,
        dealRollup,
        selectedDeals,
        fundName: 'Portfolio',
        exportDate: new Date(),
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Generate mock sparkline data for demo (in production, this would come from API)
  const generateSparklineData = (baseValue: number, volatility: number = 0.1) => {
    const points = 12;
    return Array.from({ length: points }, (_, i) => ({
      value: baseValue * (1 + (Math.sin(i * 0.8) * volatility) + (i / points) * volatility),
    }));
  };

  const portfolioChartData = dealSummaries
    ?.filter((d) => selectedDealIds.includes(d.id) && d.currentValue)
    .map((d) => ({
      name: d.name,
      value: d.currentValue || 0,
    })) || [];

  const deploymentRate = fundMetrics && fundMetrics.totalCommitments > 0
    ? (fundMetrics.capitalDeployed / fundMetrics.totalCommitments) * 100
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fund Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Performance overview and aggregated deal metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileDown className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('markdown')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Fund Metrics - Hero Section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Fund Overview</h2>

        {isMetricsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border bg-card p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-10 w-32" />
                <Skeleton className="mt-6 h-16 w-full" />
              </div>
            ))}
          </div>
        ) : fundMetrics ? (
          <>
            {/* Primary metrics with sparklines */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Assets Under Management"
                value={formatCurrency(fundMetrics.aum)}
                icon={DollarSign}
                sparklineData={generateSparklineData(fundMetrics.aum, 0.08)}
                sparklineColor="#6366f1"
                size="large"
                subtitle="Total portfolio value"
              />
              <MetricCard
                title="Total Commitments"
                value={formatCurrency(fundMetrics.totalCommitments)}
                icon={Wallet}
                sparklineData={generateSparklineData(fundMetrics.totalCommitments, 0.05)}
                sparklineColor="#10b981"
                size="large"
                subtitle={`From ${fundMetrics.investorCount} investors`}
              />
              <MetricCard
                title="Capital Deployed"
                value={formatCurrency(fundMetrics.capitalDeployed)}
                icon={PiggyBank}
                trend={deploymentRate > 50 ? { value: Math.round(deploymentRate), isPositive: true } : undefined}
                sparklineData={generateSparklineData(fundMetrics.capitalDeployed, 0.12)}
                sparklineColor="#f59e0b"
                size="large"
                subtitle={`${formatCurrency(fundMetrics.uncommittedCapital)} uncommitted`}
              />
            </div>

            {/* Secondary metrics row with gauges */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GaugeChart
                title="Deployment Rate"
                value={deploymentRate}
                maxValue={100}
                format="percent"
                color="#6366f1"
                subtitle="Capital deployed vs committed"
              />
              <MetricCard
                title="Active Deals"
                value={fundMetrics.dealCount}
                icon={Building2}
                sparklineColor="#8b5cf6"
                subtitle="Properties in portfolio"
              />
              <MetricCard
                title="Total Investors"
                value={fundMetrics.investorCount}
                icon={Users}
                sparklineColor="#06b6d4"
                subtitle={`${fundMetrics.activeInvestorCount} active`}
              />
              <GaugeChart
                title="Active Investor Rate"
                value={fundMetrics.investorCount > 0 
                  ? (fundMetrics.activeInvestorCount / fundMetrics.investorCount) * 100 
                  : 0}
                maxValue={100}
                format="percent"
                color="#10b981"
                subtitle={`${fundMetrics.activeInvestorCount} of ${fundMetrics.investorCount}`}
              />
            </div>
          </>
        ) : null}
      </section>

      {/* Deal Selection & Rollups */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Deal Performance</h2>
          <DealSelector
            deals={dealSummaries || []}
            selectedDealIds={selectedDealIds}
            onSelectionChange={setSelectedDealIds}
            isLoading={isDealsLoading}
          />
        </div>

        {selectedDealIds.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <Building2 className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-xl font-semibold">No Deals Selected</h3>
            <p className="mt-2 text-muted-foreground">
              Select one or more deals above to see aggregated metrics
            </p>
          </div>
        ) : isRollupLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border bg-card p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-8 w-28" />
                <Skeleton className="mt-2 h-4 w-20" />
              </div>
            ))}
          </div>
        ) : dealRollup ? (
          <div className="space-y-4">
            {/* Value metrics with visual emphasis */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Current Value"
                value={formatCurrency(dealRollup.totalCurrentValue)}
                icon={DollarSign}
                sparklineColor="#6366f1"
                subtitle={`${dealRollup.dealCount} deal${dealRollup.dealCount !== 1 ? 's' : ''}`}
              />
              <MetricCard
                title="Total Acquisition Cost"
                value={formatCurrency(dealRollup.totalAcquisitionCost)}
                icon={Wallet}
                sparklineColor="#64748b"
                subtitle="Original investment"
              />
              <MetricCard
                title="Total Appreciation"
                value={formatCurrency(dealRollup.totalAppreciation)}
                icon={TrendingUp}
                trend={dealRollup.appreciationPercent !== 0 ? {
                  value: Math.round(dealRollup.appreciationPercent),
                  isPositive: dealRollup.appreciationPercent > 0,
                } : undefined}
                sparklineColor={dealRollup.appreciationPercent > 0 ? '#10b981' : '#ef4444'}
                subtitle="Value gain since acquisition"
              />
              <MetricCard
                title="Total NOI"
                value={formatCurrency(dealRollup.totalNoi)}
                icon={PiggyBank}
                sparklineColor="#f59e0b"
                subtitle="Net Operating Income"
              />
            </div>

            {/* Property metrics with gauges */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GaugeChart
                title="Average Occupancy"
                value={dealRollup.avgOccupancy}
                maxValue={100}
                format="percent"
                color={dealRollup.avgOccupancy >= 90 ? '#10b981' : dealRollup.avgOccupancy >= 75 ? '#f59e0b' : '#ef4444'}
                subtitle="Weighted by unit count"
              />
              <GaugeChart
                title="Weighted Cap Rate"
                value={dealRollup.weightedCapRate}
                maxValue={15}
                format="percent"
                color="#8b5cf6"
                subtitle="Weighted by value"
              />
              <MetricCard
                title="Total Units"
                value={dealRollup.totalUnits.toLocaleString()}
                icon={Building2}
                sparklineColor="#06b6d4"
                subtitle="Across selected deals"
              />
              <MetricCard
                title="Total Sq Ft"
                value={dealRollup.totalSqFt.toLocaleString()}
                icon={Percent}
                sparklineColor="#ec4899"
                subtitle="Total square footage"
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* Portfolio Charts */}
      {portfolioChartData.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Portfolio Allocation</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <PortfolioChart
              title="Value by Deal"
              subtitle="Current market value distribution"
              data={portfolioChartData}
              type="bar"
            />
            <PortfolioChart
              title="Portfolio Distribution"
              subtitle="Percentage allocation by deal"
              data={portfolioChartData}
              type="donut"
            />
          </div>
        </section>
      )}
    </div>
  );
}
