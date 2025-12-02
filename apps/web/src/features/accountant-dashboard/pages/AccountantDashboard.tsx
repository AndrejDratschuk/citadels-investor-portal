import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { TaxSummaryCard, TaxYearSelector, K1ActivityFeed, K1ActivityItem } from '../components';
import { useTaxSummary } from '../hooks';

// Mock activity data - will be replaced with real data
const mockActivities: K1ActivityItem[] = [
  {
    id: '1',
    type: 'sent',
    investorName: 'John Smith',
    description: 'K-1 sent via email',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    type: 'generated',
    investorName: 'Sarah Johnson Family Trust',
    description: 'K-1 generated for 2024',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    type: 'viewed',
    investorName: 'Acme Holdings LLC',
    description: 'K-1 downloaded by investor',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: '4',
    type: 'sent',
    investorName: 'Michael Chen',
    description: 'K-1 sent via email',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '5',
    type: 'generated',
    investorName: 'Williams Family Trust',
    description: 'K-1 generated for 2024',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// Tax deadlines
const taxDeadlines = [
  { label: 'K-1 Distribution Deadline', date: 'March 15, 2025', daysLeft: 106 },
  { label: 'Partnership Tax Return (Form 1065)', date: 'March 15, 2025', daysLeft: 106 },
  { label: 'Extended K-1 Deadline', date: 'September 15, 2025', daysLeft: 290 },
];

export function AccountantDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1); // Default to previous tax year
  const { data: summary, isLoading } = useTaxSummary(selectedYear);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            K-1 management and tax reporting
          </p>
        </div>
        <TaxYearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TaxSummaryCard
          title="Total Investors"
          value={isLoading ? '...' : summary?.totalInvestors ?? 0}
          icon={Users}
          description="Active fund investors"
        />
        <TaxSummaryCard
          title="K-1s Generated"
          value={isLoading ? '...' : summary?.totalK1sGenerated ?? 0}
          icon={FileText}
          description={`For tax year ${selectedYear}`}
        />
        <TaxSummaryCard
          title="K-1s Pending"
          value={isLoading ? '...' : summary?.totalK1sPending ?? 0}
          icon={Clock}
          description="Awaiting generation"
        />
        <TaxSummaryCard
          title="K-1s Sent"
          value={isLoading ? '...' : summary?.totalK1sSent ?? 0}
          icon={CheckCircle2}
          description="Delivered to investors"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/accountant/k1">
            <Button variant="default" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Manage K-1s
            </Button>
          </Link>
          <Link to="/accountant/investors">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Users className="h-4 w-4" />
              View Investor Tax Data
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Generate All K-1s
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Calendar className="h-4 w-4" />
            View Tax Calendar
          </Button>
        </div>
      </div>

      {/* Tax Deadlines Alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Upcoming Tax Deadlines</h3>
            <div className="mt-3 space-y-2">
              {taxDeadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-white/50 px-4 py-2"
                >
                  <span className="text-sm font-medium text-amber-900">
                    {deadline.label}
                  </span>
                  <span className="text-sm text-amber-700">
                    {deadline.date} ({deadline.daysLeft} days)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <K1ActivityFeed activities={mockActivities} />
        </div>
        
        {/* Summary Card */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold">Tax Year {selectedYear} Summary</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Invested</span>
              <span className="font-semibold">
                {isLoading ? '...' : formatCurrency(summary?.totalInvested ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">K-1 Completion</span>
              <span className="font-semibold">
                {isLoading
                  ? '...'
                  : summary
                  ? `${Math.round(((summary.totalK1sGenerated + summary.totalK1sSent) / summary.totalInvestors) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-teal-500 transition-all"
                style={{
                  width: isLoading
                    ? '0%'
                    : summary
                    ? `${Math.round(((summary.totalK1sGenerated + summary.totalK1sSent) / summary.totalInvestors) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            <Link
              to="/accountant/k1"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all K-1s <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
