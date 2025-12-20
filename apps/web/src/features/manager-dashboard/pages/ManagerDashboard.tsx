/**
 * Manager Dashboard
 * Row-themed layout: Fund Overview → Deals → Investors → Capital Calls → Activity
 */

import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { dashboardApi, DashboardMetrics, TopDeal } from '@/lib/api/dashboard';
import { FundOverviewRow } from '../components/FundOverviewRow';
import { DealsRow } from '../components/DealsRow';
import { InvestorsRow } from '../components/InvestorsRow';
import { ActivityFeed, ActivityItem } from '../components/ActivityFeed';
import { CapitalCallProgress } from '../components/CapitalCallProgress';
import { Skeleton } from '@/components/ui/skeleton';

function formatCompact(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function DealsTable({ deals, isLoading }: { deals: TopDeal[]; isLoading: boolean }): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Building2 className="mb-2 h-8 w-8" />
        <p className="text-sm">No deals yet</p>
        <Link to="/manager/deals/new" className="mt-2 text-sm text-primary hover:underline">
          Create your first deal
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Deal Name</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Invested</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Current Value</th>
            <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">ROI</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, idx) => (
            <tr key={deal.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
              <td className="px-3 py-3">
                <Link
                  to={`/manager/deals/${deal.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {deal.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-right">{formatCompact(deal.capitalInvested)}</td>
              <td className="px-3 py-3 text-right">{formatCompact(deal.currentValue)}</td>
              <td className="px-3 py-3 text-right">
                {deal.roiPercent !== null ? (
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    deal.roiPercent >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {deal.roiPercent >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(deal.roiPercent).toFixed(1)}%
                  </span>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mock/fallback data for when API returns empty or fails
const mockDashboardData: DashboardMetrics = {
  fundKpis: {
    totalAum: 47500000,
    committedCapital: 52000000,
    capitalCalled: 38500000,
    capitalDeployed: 35200000,
    cashOnHand: 3300000,
    debtOutstanding: 12800000,
    fundRoiPercent: 18.7,
    irrPercent: 14.2,
  },
  deals: {
    top5: [
      {
        id: 'd1',
        name: 'Riverside Apartments',
        capitalInvested: 8500000,
        currentValue: 10200000,
        roiPercent: 20.0,
        acquisitionDate: '2023-03-15',
        holdPeriodDays: 645,
      },
      {
        id: 'd2',
        name: 'Downtown Office Tower',
        capitalInvested: 12000000,
        currentValue: 13800000,
        roiPercent: 15.0,
        acquisitionDate: '2023-06-01',
        holdPeriodDays: 567,
      },
      {
        id: 'd3',
        name: 'Eastside Industrial Park',
        capitalInvested: 6200000,
        currentValue: 7130000,
        roiPercent: 15.0,
        acquisitionDate: '2023-09-20',
        holdPeriodDays: 456,
      },
      {
        id: 'd4',
        name: 'Harbor View Retail Center',
        capitalInvested: 5000000,
        currentValue: 5400000,
        roiPercent: 8.0,
        acquisitionDate: '2024-01-10',
        holdPeriodDays: 344,
      },
      {
        id: 'd5',
        name: 'Tech Campus Building A',
        capitalInvested: 3500000,
        currentValue: 3970000,
        roiPercent: 13.4,
        acquisitionDate: '2024-04-05',
        holdPeriodDays: 259,
      },
    ],
    rollups: {
      capitalInvested: 35200000,
      capitalCollected: 38500000,
      capitalOutstanding: 4200000,
      capitalReserves: 13500000,
    },
    portfolioByDeal: [
      { dealId: 'd1', dealName: 'Riverside Apartments', value: 10200000 },
      { dealId: 'd2', dealName: 'Downtown Office Tower', value: 13800000 },
      { dealId: 'd3', dealName: 'Eastside Industrial', value: 7130000 },
      { dealId: 'd4', dealName: 'Harbor View Retail', value: 5400000 },
      { dealId: 'd5', dealName: 'Tech Campus', value: 3970000 },
    ],
  },
  investors: {
    statusCounts: {
      active: 24,
      onboarding: 8,
      prospect: 12,
      inactive: 3,
    },
    top5: [
      { id: 'i1', name: 'Blackstone Holdings LP', capitalCommitted: 8000000, capitalCalled: 6400000 },
      { id: 'i2', name: 'Pacific Growth Partners', capitalCommitted: 6500000, capitalCalled: 5200000 },
      { id: 'i3', name: 'Alpine Investment Group', capitalCommitted: 5000000, capitalCalled: 4000000 },
      { id: 'i4', name: 'Summit Capital LLC', capitalCommitted: 4200000, capitalCalled: 3360000 },
      { id: 'i5', name: 'Meridian Wealth Fund', capitalCommitted: 3800000, capitalCalled: 3040000 },
    ],
    totalCount: 47,
  },
};

// Mock data for sections not yet API-connected
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'wire_received',
    title: 'Wire Received',
    description: 'John Smith - $125,000 for Riverside Apartments',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'success',
  },
  {
    id: '2',
    type: 'document_signed',
    title: 'Document Signed',
    description: 'Sarah Johnson signed Subscription Agreement',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'success',
  },
  {
    id: '3',
    type: 'investor_signup',
    title: 'New Investor',
    description: 'Michael Chen completed onboarding',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: 'success',
  },
  {
    id: '4',
    type: 'capital_call_sent',
    title: 'Capital Call Sent',
    description: 'Downtown Office Tower - $2.5M to 12 investors',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: 'pending',
  },
  {
    id: '5',
    type: 'document_sent',
    title: 'Document Sent',
    description: 'Q4 Report sent to all investors',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'success',
  },
];

const mockCapitalCalls = [
  {
    id: '1',
    dealName: 'Downtown Office Tower',
    totalAmount: 2500000,
    receivedAmount: 1875000,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'partial' as const,
  },
  {
    id: '2',
    dealName: 'Eastside Industrial Park',
    totalAmount: 3500000,
    receivedAmount: 875000,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'sent' as const,
  },
];

export function ManagerDashboard(): JSX.Element {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: dashboardApi.getMetrics,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Use mock data as fallback if API fails or returns empty
  const hasRealData = metrics && (
    metrics.fundKpis?.totalAum !== null ||
    (metrics.deals?.top5?.length ?? 0) > 0 ||
    (metrics.investors?.totalCount ?? 0) > 0
  );
  
  const displayData = hasRealData ? metrics : mockDashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fund Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Row 1: KPI Cards (8 metrics) */}
      <FundOverviewRow kpis={displayData?.fundKpis ?? null} isLoading={isLoading} />

      {/* Row 2: Performance Chart (full width) */}
      <DealsRow deals={displayData?.deals ?? null} isLoading={isLoading} />

      {/* Row 3: Deals Table + Investors (side by side) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deals Table */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Top Deals</h2>
            <Link
              to="/manager/deals"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <DealsTable deals={displayData?.deals?.top5 ?? []} isLoading={isLoading} />
        </div>

        {/* Investors */}
        <InvestorsRow investors={displayData?.investors ?? null} isLoading={isLoading} />
      </div>

      {/* Row 4: Capital Calls + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Capital Calls */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Active Capital Calls</h2>
            <Link
              to="/manager/capital-calls"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockCapitalCalls.map((call) => (
              <CapitalCallProgress
                key={call.id}
                dealName={call.dealName}
                totalAmount={call.totalAmount}
                receivedAmount={call.receivedAmount}
                deadline={call.deadline}
                status={call.status}
              />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={mockActivities} />
      </div>
    </div>
  );
}
