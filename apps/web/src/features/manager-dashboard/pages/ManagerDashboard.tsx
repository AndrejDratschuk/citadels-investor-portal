import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@altsui/shared';
import { StatsCard } from '../components/StatsCard';
import { ActivityFeed, ActivityItem } from '../components/ActivityFeed';
import { FundChart } from '../components/FundChart';
import { CapitalCallProgress } from '../components/CapitalCallProgress';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

// Activity data is separate from dashboard stats
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

// Status colors for investor status chart
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  committed: 'bg-green-500',
  onboarding: 'bg-blue-500',
  prospect: 'bg-gray-400',
  pending: 'bg-yellow-500',
  unknown: 'bg-gray-300',
};

function StatsCardSkeleton(): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

function ChartSkeleton(): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-4 h-[200px] w-full" />
    </div>
  );
}

function CapitalCallSkeleton(): JSX.Element {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-3 h-2 w-full rounded-full" />
      <div className="mt-3 flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function ManagerDashboard(): JSX.Element {
  const { data: stats, isLoading, error } = useDashboardStats();

  // Transform portfolio data for chart
  const portfolioChartData = stats?.portfolioByDeal.map((deal) => ({
    label: deal.name,
    value: deal.value,
  })) ?? [];

  // Transform investor status data for chart
  const investorStatusChartData = stats?.investorsByStatus.map((group) => ({
    label: group.status.charAt(0).toUpperCase() + group.status.slice(1),
    value: group.count,
    color: STATUS_COLORS[group.status.toLowerCase()] ?? 'bg-gray-400',
  })) ?? [];

  // Transform capital calls for display
  const capitalCallsDisplay = stats?.activeCapitalCallsList.map((call) => ({
    id: call.id,
    dealName: call.dealName,
    totalAmount: call.totalAmount,
    receivedAmount: call.receivedAmount,
    deadline: call.dueDate ?? undefined,
    status: call.status,
  })) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Failed to Load Dashboard</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fund Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Altsui Growth Fund I Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Total AUM"
              value={formatCurrency(stats?.totalAUM ?? 0)}
              icon={DollarSign}
              description="Assets under management"
            />
            <StatsCard
              title="Total Investors"
              value={stats?.totalInvestors ?? 0}
              icon={Users}
              description="Active fund investors"
            />
            <StatsCard
              title="Active Deals"
              value={stats?.activeDeals ?? 0}
              icon={Building2}
              description="Properties in portfolio"
            />
            <StatsCard
              title="Pending Capital Calls"
              value={stats?.pendingCapitalCalls ?? 0}
              icon={TrendingUp}
              description="Awaiting wire transfers"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <FundChart
              title="Portfolio by Deal"
              data={portfolioChartData.length > 0 ? portfolioChartData : [{ label: 'No deals yet', value: 0 }]}
              type="bar"
            />
            <FundChart
              title="Investor Status"
              data={investorStatusChartData.length > 0 ? investorStatusChartData : [{ label: 'No investors yet', value: 0, color: 'bg-gray-400' }]}
              type="donut"
            />
          </>
        )}
      </div>

      {/* Capital Calls Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Capital Calls</h2>
          <Link
            to="/manager/capital-calls"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {isLoading ? (
            <>
              <CapitalCallSkeleton />
              <CapitalCallSkeleton />
            </>
          ) : capitalCallsDisplay.length > 0 ? (
            capitalCallsDisplay.map((call) => (
              <CapitalCallProgress
                key={call.id}
                dealName={call.dealName}
                totalAmount={call.totalAmount}
                receivedAmount={call.receivedAmount}
                deadline={call.deadline}
                status={call.status}
              />
            ))
          ) : (
            <div className="col-span-2 rounded-xl border bg-card p-6 text-center">
              <p className="text-muted-foreground">No active capital calls</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={mockActivities} />
    </div>
  );
}
