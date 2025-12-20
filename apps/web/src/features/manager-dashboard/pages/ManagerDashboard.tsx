/**
 * Manager Dashboard
 * Row-themed layout: Fund Overview → Deals → Investors → Capital Calls → Activity
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/lib/api/dashboard';
import { FundOverviewRow } from '../components/FundOverviewRow';
import { DealsRow } from '../components/DealsRow';
import { InvestorsRow } from '../components/InvestorsRow';
import { ActivityFeed, ActivityItem } from '../components/ActivityFeed';
import { CapitalCallProgress } from '../components/CapitalCallProgress';

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
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fund Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Real-time fund performance overview</p>
      </div>

      {/* Row 1: Fund Overview KPIs */}
      <FundOverviewRow kpis={metrics?.fundKpis ?? null} isLoading={isLoading} />

      {/* Row 2: Deals */}
      <DealsRow deals={metrics?.deals ?? null} isLoading={isLoading} />

      {/* Row 3: Investors */}
      <InvestorsRow investors={metrics?.investors ?? null} isLoading={isLoading} />

      {/* Row 4: Capital Calls (existing section) */}
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

      {/* Row 5: Activity Feed */}
      <ActivityFeed activities={mockActivities} />
    </div>
  );
}
