import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Filter,
  DollarSign,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InvestorStatus {
  paid: number;
  pending: number;
  overdue: number;
  partial: number;
}

interface CapitalCall {
  id: string;
  dealId: string;
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  callDate: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  investorCount: number;
  investorStatus: InvestorStatus;
  sentAt: string | null;
  wireConfirmedCount: number;
  pendingReminderCount: number;
  lastReminderSent: string | null;
}

// Mock data with enhanced fields
const mockCapitalCalls: CapitalCall[] = [
  {
    id: '1',
    dealId: '2',
    dealName: 'Downtown Office Tower',
    totalAmount: 2500000,
    receivedAmount: 1875000,
    deadline: '2024-03-15',
    callDate: '2024-02-15',
    status: 'partial',
    investorCount: 12,
    investorStatus: { paid: 7, pending: 2, overdue: 1, partial: 2 },
    sentAt: '2024-02-15',
    wireConfirmedCount: 7,
    pendingReminderCount: 3,
    lastReminderSent: '2024-03-10',
  },
  {
    id: '2',
    dealId: '3',
    dealName: 'Eastside Industrial Park',
    totalAmount: 3500000,
    receivedAmount: 875000,
    deadline: '2024-03-30',
    callDate: '2024-02-28',
    status: 'sent',
    investorCount: 18,
    investorStatus: { paid: 5, pending: 10, overdue: 0, partial: 3 },
    sentAt: '2024-02-28',
    wireConfirmedCount: 5,
    pendingReminderCount: 0,
    lastReminderSent: null,
  },
  {
    id: '3',
    dealId: '4',
    dealName: 'Riverside Apartments',
    totalAmount: 1200000,
    receivedAmount: 1200000,
    deadline: '2024-01-31',
    callDate: '2024-01-05',
    status: 'funded',
    investorCount: 15,
    investorStatus: { paid: 15, pending: 0, overdue: 0, partial: 0 },
    sentAt: '2024-01-05',
    wireConfirmedCount: 15,
    pendingReminderCount: 0,
    lastReminderSent: null,
  },
  {
    id: '4',
    dealId: '5',
    dealName: 'Lakefront Retail Center',
    totalAmount: 800000,
    receivedAmount: 800000,
    deadline: '2023-12-15',
    callDate: '2023-11-20',
    status: 'closed',
    investorCount: 10,
    investorStatus: { paid: 10, pending: 0, overdue: 0, partial: 0 },
    sentAt: '2023-11-20',
    wireConfirmedCount: 10,
    pendingReminderCount: 0,
    lastReminderSent: null,
  },
  {
    id: '5',
    dealId: '6',
    dealName: 'Tech Campus Development',
    totalAmount: 5000000,
    receivedAmount: 0,
    deadline: '2024-04-15',
    callDate: '2024-03-01',
    status: 'draft',
    investorCount: 0,
    investorStatus: { paid: 0, pending: 0, overdue: 0, partial: 0 },
    sentAt: null,
    wireConfirmedCount: 0,
    pendingReminderCount: 0,
    lastReminderSent: null,
  },
];

type StatusFilter = 'all' | 'draft' | 'sent' | 'partial' | 'funded' | 'closed';

const statusStyles = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
  funded: { bg: 'bg-green-100', text: 'text-green-700', label: 'Funded' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },
};

export function CapitalCallsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredCalls = mockCapitalCalls.filter((call) => {
    if (statusFilter === 'all') return true;
    return call.status === statusFilter;
  });

  const statusCounts = {
    all: mockCapitalCalls.length,
    draft: mockCapitalCalls.filter((c) => c.status === 'draft').length,
    sent: mockCapitalCalls.filter((c) => c.status === 'sent').length,
    partial: mockCapitalCalls.filter((c) => c.status === 'partial').length,
    funded: mockCapitalCalls.filter((c) => c.status === 'funded').length,
    closed: mockCapitalCalls.filter((c) => c.status === 'closed').length,
  };

  const totalOutstanding = mockCapitalCalls
    .filter((c) => c.status === 'sent' || c.status === 'partial')
    .reduce((sum, c) => sum + (c.totalAmount - c.receivedAmount), 0);

  // Count completed calls this year
  const currentYear = new Date().getFullYear();
  const completedThisYear = mockCapitalCalls.filter(
    (c) =>
      (c.status === 'funded' || c.status === 'closed') &&
      new Date(c.deadline).getFullYear() === currentYear
  ).length;

  // Count investors needing reminders
  const totalOverdueInvestors = mockCapitalCalls.reduce(
    (sum, c) => sum + c.investorStatus.overdue,
    0
  );

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capital Calls</h1>
          <p className="mt-1 text-muted-foreground">
            Manage fund capital calls and track wire receipts
          </p>
        </div>
        <Link to="/manager/capital-calls/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Capital Call
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-white/80" />
            <p className="text-sm text-white/80">Total Outstanding</p>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
          <p className="mt-1 text-sm text-white/70">Awaiting wire transfers</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Active Calls</p>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {statusCounts.sent + statusCounts.partial}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">In progress</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-muted-foreground">Completed This Year</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-600">{completedThisYear}</p>
          <p className="mt-1 text-sm text-muted-foreground">Fully funded</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-muted-foreground">Overdue Investors</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{totalOverdueInvestors}</p>
          <p className="mt-1 text-sm text-muted-foreground">Need reminders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', 'draft', 'sent', 'partial', 'funded', 'closed'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1 text-xs opacity-70">({statusCounts[status]})</span>
            </button>
          )
        )}
      </div>

      {/* Capital Calls List */}
      {filteredCalls.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">No capital calls found</h3>
          <p className="mt-2 text-muted-foreground">
            Create a new capital call to request funds from investors.
          </p>
          <Link to="/manager/capital-calls/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Capital Call
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCalls.map((call) => {
            const daysUntilDeadline = getDaysUntilDeadline(call.deadline);
            const isOverdue = daysUntilDeadline < 0 && call.status !== 'funded' && call.status !== 'closed';
            const progress = (call.receivedAmount / call.totalAmount) * 100;

            return (
              <Link
                key={call.id}
                to={`/manager/capital-calls/${call.id}`}
                className="block"
              >
                <div
                  className={cn(
                    'rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/50',
                    isOverdue && 'border-red-200 bg-red-50/30'
                  )}
                >
                  {/* Top Row: Deal Name + Status + Progress */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-lg',
                          isOverdue ? 'bg-red-100' : 'bg-primary/10'
                        )}
                      >
                        <Building2
                          className={cn('h-6 w-6', isOverdue ? 'text-red-600' : 'text-primary')}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{call.dealName}</h3>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              statusStyles[call.status].bg,
                              statusStyles[call.status].text
                            )}
                          >
                            {statusStyles[call.status].label}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(call.totalAmount)} • {call.investorCount} investors
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 lg:w-64">
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              progress >= 100
                                ? 'bg-green-500'
                                : progress > 0
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                            )}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {/* Call Date */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Call Date
                      </div>
                      <p className="mt-1 font-semibold text-sm">
                        {call.callDate ? formatDate(call.callDate) : '-'}
                      </p>
                    </div>

                    {/* Deadline */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Deadline
                      </div>
                      <p
                        className={cn(
                          'mt-1 font-semibold text-sm',
                          isOverdue && 'text-red-600'
                        )}
                      >
                        {formatDate(call.deadline)}
                      </p>
                      <p className={cn('text-xs', isOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                        {isOverdue
                          ? `${Math.abs(daysUntilDeadline)}d overdue`
                          : `${daysUntilDeadline}d remaining`}
                      </p>
                    </div>

                    {/* Amount Requested */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        Requested
                      </div>
                      <p className="mt-1 font-semibold text-sm">
                        {formatCurrency(call.totalAmount)}
                      </p>
                    </div>

                    {/* Received */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        Received
                      </div>
                      <p className="mt-1 font-semibold text-sm text-green-600">
                        {formatCurrency(call.receivedAmount)}
                      </p>
                    </div>

                    {/* Investor Status */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Status
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {call.investorStatus.paid > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {call.investorStatus.paid}
                          </span>
                        )}
                        {call.investorStatus.partial > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                            <Clock className="h-3 w-3" />
                            {call.investorStatus.partial}
                          </span>
                        )}
                        {call.investorStatus.pending > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                            <Clock className="h-3 w-3" />
                            {call.investorStatus.pending}
                          </span>
                        )}
                        {call.investorStatus.overdue > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            {call.investorStatus.overdue}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Wire & Reminders */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Bell className="h-3.5 w-3.5" />
                        Wire/Remind
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs">
                          <span className="font-medium text-green-600">
                            {call.wireConfirmedCount}
                          </span>
                          <span className="text-muted-foreground"> confirmed</span>
                        </p>
                        {call.pendingReminderCount > 0 && (
                          <p className="text-xs">
                            <span className="font-medium text-orange-600">
                              {call.pendingReminderCount}
                            </span>
                            <span className="text-muted-foreground"> need reminder</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
