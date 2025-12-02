import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { CapitalCallProgress } from '../components/CapitalCallProgress';
import { cn } from '@/lib/utils';

interface CapitalCall {
  id: string;
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  investorCount: number;
  sentAt: string | null;
}

// Mock data
const mockCapitalCalls: CapitalCall[] = [
  {
    id: '1',
    dealName: 'Downtown Office Tower',
    totalAmount: 2500000,
    receivedAmount: 1875000,
    deadline: '2024-03-15',
    status: 'partial',
    investorCount: 12,
    sentAt: '2024-02-15',
  },
  {
    id: '2',
    dealName: 'Eastside Industrial Park',
    totalAmount: 3500000,
    receivedAmount: 875000,
    deadline: '2024-03-30',
    status: 'sent',
    investorCount: 18,
    sentAt: '2024-02-28',
  },
  {
    id: '3',
    dealName: 'Riverside Apartments',
    totalAmount: 1200000,
    receivedAmount: 1200000,
    deadline: '2024-01-31',
    status: 'funded',
    investorCount: 15,
    sentAt: '2024-01-05',
  },
  {
    id: '4',
    dealName: 'Lakefront Retail Center',
    totalAmount: 800000,
    receivedAmount: 800000,
    deadline: '2023-12-15',
    status: 'closed',
    investorCount: 10,
    sentAt: '2023-11-20',
  },
  {
    id: '5',
    dealName: 'Tech Campus Development',
    totalAmount: 5000000,
    receivedAmount: 0,
    deadline: '2024-04-15',
    status: 'draft',
    investorCount: 0,
    sentAt: null,
  },
];

type StatusFilter = 'all' | 'draft' | 'sent' | 'partial' | 'funded' | 'closed';

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
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
          <p className="text-sm text-white/80">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
          <p className="mt-1 text-sm text-white/70">Awaiting wire transfers</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Calls</p>
          <p className="mt-1 text-2xl font-bold">
            {statusCounts.sent + statusCounts.partial}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">In progress</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completed This Year</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {statusCounts.funded + statusCounts.closed}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Fully funded</p>
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
          {filteredCalls.map((call) => (
            <Link
              key={call.id}
              to={`/manager/capital-calls/${call.id}`}
              className="block"
            >
              <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{call.dealName}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{call.investorCount} investors</span>
                        <span>•</span>
                        <span>Due: {formatDate(call.deadline)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Progress</p>
                      <p className="font-semibold">
                        {formatCurrency(call.receivedAmount)} / {formatCurrency(call.totalAmount)}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            call.receivedAmount >= call.totalAmount
                              ? 'bg-green-500'
                              : call.receivedAmount > 0
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          )}
                          style={{
                            width: `${Math.min((call.receivedAmount / call.totalAmount) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-center text-xs text-muted-foreground">
                        {((call.receivedAmount / call.totalAmount) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


