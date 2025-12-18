import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import { StatsCard } from '../components/StatsCard';
import { ActivityFeed, ActivityItem } from '../components/ActivityFeed';
import { FundChart } from '../components/FundChart';
import { CapitalCallProgress } from '../components/CapitalCallProgress';

// Mock data - will be replaced with real API calls
const mockStats = {
  totalAUM: 68500000,
  totalInvestors: 47,
  activeDeals: 4,
  pendingCapitalCalls: 2,
  capitalDeployed: 52300000,
  uncommittedCapital: 16200000,
};

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

const mockDealData = [
  { label: 'Riverside Apartments', value: 14200000 },
  { label: 'Downtown Office Tower', value: 28500000 },
  { label: 'Eastside Industrial', value: 18500000 },
  { label: 'Lakefront Retail', value: 10500000 },
];

const mockInvestorStatus = [
  { label: 'Active', value: 38, color: 'bg-green-500' },
  { label: 'Onboarding', value: 5, color: 'bg-blue-500' },
  { label: 'Prospect', value: 4, color: 'bg-gray-400' },
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

export function ManagerDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fund Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          FlowVeda Growth Fund I Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total AUM"
          value={formatCurrency(mockStats.totalAUM)}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          description="Assets under management"
        />
        <StatsCard
          title="Total Investors"
          value={mockStats.totalInvestors}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          description="Active fund investors"
        />
        <StatsCard
          title="Active Deals"
          value={mockStats.activeDeals}
          icon={Building2}
          description="Properties in portfolio"
        />
        <StatsCard
          title="Pending Capital Calls"
          value={mockStats.pendingCapitalCalls}
          icon={TrendingUp}
          description="Awaiting wire transfers"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FundChart
          title="Portfolio by Deal"
          data={mockDealData}
          type="bar"
        />
        <FundChart
          title="Investor Status"
          data={mockInvestorStatus}
          type="donut"
        />
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
  );
}
