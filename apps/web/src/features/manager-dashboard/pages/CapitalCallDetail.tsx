import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Users,
  Send,
  Bell,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { CapitalCallTable, CapitalCallInvestorItem } from '../components/CapitalCallTable';
import { cn } from '@/lib/utils';

type CapitalCallStatus = 'draft' | 'sent' | 'partial' | 'funded' | 'closed';

interface MockCapitalCall {
  id: string;
  dealId: string;
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  status: CapitalCallStatus;
  sentAt: string;
  createdAt: string;
}

// Mock data
const mockCapitalCall: MockCapitalCall = {
  id: '1',
  dealId: '2',
  dealName: 'Downtown Office Tower',
  totalAmount: 2500000,
  receivedAmount: 1875000,
  deadline: '2024-03-15',
  status: 'partial',
  sentAt: '2024-02-15',
  createdAt: '2024-02-10',
};

const mockItems: CapitalCallInvestorItem[] = [
  {
    id: '1',
    investorId: '1',
    investorName: 'John Smith',
    investorEmail: 'john.smith@example.com',
    amountDue: 250000,
    amountReceived: 250000,
    status: 'complete',
    wireReceivedAt: '2024-02-20',
    reminderCount: 0,
  },
  {
    id: '2',
    investorId: '2',
    investorName: 'Sarah Johnson',
    investorEmail: 'sarah.j@example.com',
    amountDue: 175000,
    amountReceived: 175000,
    status: 'complete',
    wireReceivedAt: '2024-02-22',
    reminderCount: 0,
  },
  {
    id: '3',
    investorId: '3',
    investorName: 'Michael Chen',
    investorEmail: 'mchen@example.com',
    amountDue: 500000,
    amountReceived: 250000,
    status: 'partial',
    wireReceivedAt: '2024-02-25',
    reminderCount: 1,
  },
  {
    id: '4',
    investorId: '4',
    investorName: 'Emily Davis',
    investorEmail: 'emily.davis@example.com',
    amountDue: 375000,
    amountReceived: 375000,
    status: 'complete',
    wireReceivedAt: '2024-02-21',
    reminderCount: 0,
  },
  {
    id: '5',
    investorId: '5',
    investorName: 'Robert Wilson',
    investorEmail: 'rwilson@example.com',
    amountDue: 200000,
    amountReceived: 0,
    status: 'pending',
    wireReceivedAt: null,
    reminderCount: 2,
  },
];

const statusStyles = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  funded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

export function CapitalCallDetail() {
  const [call] = useState(mockCapitalCall);
  const [items] = useState(mockItems);

  const progress = (call.receivedAmount / call.totalAmount) * 100;
  const daysUntilDeadline = Math.ceil(
    (new Date(call.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDeadline < 0;

  const completedCount = items.filter((i) => i.status === 'complete').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const partialCount = items.filter((i) => i.status === 'partial').length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/capital-calls">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Capital Calls
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <DollarSign className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Capital Call</h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                  statusStyles[call.status]
                )}
              >
                {call.status}
              </span>
            </div>
            <Link
              to={`/manager/deals/${call.dealId}`}
              className="text-muted-foreground hover:underline"
            >
              {call.dealName}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {call.status !== 'draft' && call.status !== 'closed' && (
            <>
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Send Reminders
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </>
          )}
          {call.status === 'draft' && (
            <Button size="sm">
              <Send className="mr-2 h-4 w-4" />
              Send to Investors
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Total Amount</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(call.totalAmount)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Received</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(call.receivedAmount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{progress.toFixed(0)}% complete</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Deadline</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatDate(call.deadline)}</p>
          <p
            className={cn(
              'mt-1 text-sm',
              isOverdue ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {isOverdue
              ? `${Math.abs(daysUntilDeadline)} days overdue`
              : `${daysUntilDeadline} days remaining`}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Investors</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="text-green-600">{completedCount} complete</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-yellow-600">{partialCount + pendingCount} pending</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Collection Progress</h3>
          <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100
                ? 'bg-green-500'
                : progress >= 75
                ? 'bg-blue-500'
                : progress >= 50
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>$0</span>
          <span>{formatCurrency(call.totalAmount)}</span>
        </div>
      </div>

      {/* Investor Breakdown */}
      <div>
        <h3 className="mb-4 font-semibold">Investor Breakdown</h3>
        <CapitalCallTable
          items={items}
          onMarkReceived={(itemId) => console.log('Mark received:', itemId)}
          onSendReminder={(itemId) => console.log('Send reminder:', itemId)}
        />
      </div>
    </div>
  );
}


