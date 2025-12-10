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
  Clock,
  AlertCircle,
  Building2,
  CreditCard,
  TrendingUp,
  Mail,
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
  callDate: string;
  status: CapitalCallStatus;
  sentAt: string;
  createdAt: string;
  callNumber: number;
  purpose: string;
}

// Mock data
const mockCapitalCall: MockCapitalCall = {
  id: '1',
  dealId: '2',
  dealName: 'Downtown Office Tower',
  totalAmount: 2500000,
  receivedAmount: 1875000,
  deadline: '2024-03-15',
  callDate: '2024-02-15',
  status: 'partial',
  sentAt: '2024-02-15',
  createdAt: '2024-02-10',
  callNumber: 2,
  purpose: 'Property acquisition closing costs and initial renovation funding',
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
    wireConfirmed: true,
    wireReference: 'WIR-2024-00145',
    reminderCount: 0,
    lastReminderSent: null,
    dueDate: '2024-03-15',
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
    wireConfirmed: true,
    wireReference: 'WIR-2024-00152',
    reminderCount: 0,
    lastReminderSent: null,
    dueDate: '2024-03-15',
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
    wireConfirmed: true,
    wireReference: 'WIR-2024-00167',
    reminderCount: 1,
    lastReminderSent: '2024-03-05',
    dueDate: '2024-03-15',
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
    wireConfirmed: true,
    wireReference: 'WIR-2024-00148',
    reminderCount: 0,
    lastReminderSent: null,
    dueDate: '2024-03-15',
  },
  {
    id: '5',
    investorId: '5',
    investorName: 'Robert Wilson',
    investorEmail: 'rwilson@example.com',
    amountDue: 200000,
    amountReceived: 0,
    status: 'overdue',
    wireReceivedAt: null,
    wireConfirmed: false,
    wireReference: null,
    reminderCount: 3,
    lastReminderSent: '2024-03-12',
    dueDate: '2024-03-15',
  },
  {
    id: '6',
    investorId: '6',
    investorName: 'Lisa Anderson',
    investorEmail: 'lisa.a@example.com',
    amountDue: 300000,
    amountReceived: 300000,
    status: 'complete',
    wireReceivedAt: '2024-02-28',
    wireConfirmed: false,
    wireReference: null,
    reminderCount: 0,
    lastReminderSent: null,
    dueDate: '2024-03-15',
  },
  {
    id: '7',
    investorId: '7',
    investorName: 'David Martinez',
    investorEmail: 'd.martinez@example.com',
    amountDue: 450000,
    amountReceived: 450000,
    status: 'complete',
    wireReceivedAt: '2024-02-24',
    wireConfirmed: true,
    wireReference: 'WIR-2024-00161',
    reminderCount: 0,
    lastReminderSent: null,
    dueDate: '2024-03-15',
  },
  {
    id: '8',
    investorId: '8',
    investorName: 'Jennifer Taylor',
    investorEmail: 'j.taylor@example.com',
    amountDue: 250000,
    amountReceived: 75000,
    status: 'partial',
    wireReceivedAt: '2024-03-01',
    wireConfirmed: true,
    wireReference: 'WIR-2024-00178',
    reminderCount: 2,
    lastReminderSent: '2024-03-10',
    dueDate: '2024-03-15',
  },
];

const statusStyles = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sent' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
  funded: { bg: 'bg-green-100', text: 'text-green-700', label: 'Funded' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },
};

export function CapitalCallDetail() {
  const [call] = useState(mockCapitalCall);
  const [items] = useState(mockItems);

  const progress = (call.receivedAmount / call.totalAmount) * 100;
  const daysUntilDeadline = Math.ceil(
    (new Date(call.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilDeadline < 0;

  // Calculate status counts
  const statusCounts = {
    complete: items.filter((i) => i.status === 'complete').length,
    partial: items.filter((i) => i.status === 'partial').length,
    pending: items.filter((i) => i.status === 'pending').length,
    overdue: items.filter((i) => i.status === 'overdue').length,
  };

  // Wire confirmation stats
  const wireStats = {
    confirmed: items.filter((i) => i.wireConfirmed).length,
    unconfirmed: items.filter((i) => i.amountReceived > 0 && !i.wireConfirmed).length,
    pending: items.filter((i) => i.amountReceived === 0).length,
  };

  // Reminder stats
  const reminderStats = {
    totalSent: items.reduce((sum, i) => sum + i.reminderCount, 0),
    investorsReminded: items.filter((i) => i.reminderCount > 0).length,
    needReminder: items.filter(
      (i) => (i.status === 'overdue' || i.status === 'partial' || i.status === 'pending') &&
        (i.reminderCount === 0 || (i.lastReminderSent && new Date(i.lastReminderSent) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)))
    ).length,
  };

  // Completed this year calculation
  const currentYear = new Date().getFullYear();
  const completedThisYear = 3; // Mock value - would come from API

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
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              isOverdue ? 'bg-red-100' : 'bg-primary/10'
            )}
          >
            <DollarSign className={cn('h-7 w-7', isOverdue ? 'text-red-600' : 'text-primary')} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Capital Call #{call.callNumber}</h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusStyles[call.status].bg,
                  statusStyles[call.status].text
                )}
              >
                {statusStyles[call.status].label}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Link
                to={`/manager/deals/${call.dealId}`}
                className="flex items-center gap-1 text-muted-foreground hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {call.dealName}
              </Link>
            </div>
            {call.purpose && (
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">{call.purpose}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {call.status !== 'draft' && call.status !== 'closed' && (
            <>
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Send Reminders ({reminderStats.needReminder})
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email All
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

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Amount */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Amount Requested</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(call.totalAmount)}</p>
          <p className="text-sm text-muted-foreground">
            Call #{call.callNumber} for {call.dealName}
          </p>
        </div>

        {/* Received */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Amount Received</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrency(call.receivedAmount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{progress.toFixed(0)}% collected</p>
        </div>

        {/* Call Date / Deadline */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Timeline</span>
          </div>
          <div className="mt-1 space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Call Date:</span>{' '}
              <span className="font-medium">{formatDate(call.callDate)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Deadline:</span>{' '}
              <span className={cn('font-medium', isOverdue && 'text-red-600')}>
                {formatDate(call.deadline)}
              </span>
            </p>
          </div>
          <p
            className={cn(
              'mt-1 text-sm font-medium',
              isOverdue ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {isOverdue
              ? `${Math.abs(daysUntilDeadline)} days overdue`
              : `${daysUntilDeadline} days remaining`}
          </p>
        </div>

        {/* Completed This Year */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Completed ({currentYear})</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-600">{completedThisYear}</p>
          <p className="mt-1 text-sm text-muted-foreground">Capital calls fully funded</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Investor Status */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Investor Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Paid</span>
              </div>
              <span className="font-semibold">{statusCounts.complete}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Partial</span>
              </div>
              <span className="font-semibold">{statusCounts.partial}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="font-semibold">{statusCounts.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm">Overdue</span>
              </div>
              <span className="font-semibold text-red-600">{statusCounts.overdue}</span>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(statusCounts.complete / items.length) * 100}%` }}
            />
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${(statusCounts.partial / items.length) * 100}%` }}
            />
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(statusCounts.pending / items.length) * 100}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${(statusCounts.overdue / items.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Wire Confirmation Status */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Wire Confirmation</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Confirmed</span>
              </div>
              <span className="font-semibold text-green-600">{wireStats.confirmed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Needs Confirmation</span>
              </div>
              <span className="font-semibold text-yellow-600">{wireStats.unconfirmed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Awaiting Payment</span>
              </div>
              <span className="font-semibold">{wireStats.pending}</span>
            </div>
          </div>
          {wireStats.unconfirmed > 0 && (
            <Button variant="outline" size="sm" className="w-full mt-4">
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm {wireStats.unconfirmed} Pending Wire{wireStats.unconfirmed > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        {/* Reminder Triggers */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Reminder Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Reminders Sent</span>
              <span className="font-semibold">{reminderStats.totalSent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Investors Reminded</span>
              <span className="font-semibold">{reminderStats.investorsReminded}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Need Follow-up</span>
              <span
                className={cn(
                  'font-semibold',
                  reminderStats.needReminder > 0 ? 'text-orange-600' : 'text-green-600'
                )}
              >
                {reminderStats.needReminder}
              </span>
            </div>
          </div>
          {reminderStats.needReminder > 0 && (
            <div className="mt-4 rounded-lg bg-orange-50 p-3">
              <p className="text-sm text-orange-700">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                {reminderStats.needReminder} investor{reminderStats.needReminder > 1 ? 's' : ''}{' '}
                {reminderStats.needReminder > 1 ? 'haven\'t' : 'hasn\'t'} received a reminder in 3+
                days
              </p>
              <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200">
                <Bell className="mr-2 h-4 w-4" />
                Send Reminders
              </Button>
            </div>
          )}
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
          <span>
            {formatCurrency(call.receivedAmount)} of {formatCurrency(call.totalAmount)}
          </span>
        </div>
      </div>

      {/* Investor Breakdown */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Investor Breakdown</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {items.length} investors • {statusCounts.complete} paid •{' '}
              {statusCounts.partial + statusCounts.pending + statusCounts.overdue} pending
            </span>
          </div>
        </div>
        <CapitalCallTable
          items={items}
          onMarkReceived={(itemId) => console.log('Mark received:', itemId)}
          onConfirmWire={(itemId, ref) => console.log('Confirm wire:', itemId, ref)}
          onSendReminder={(itemId) => console.log('Send reminder:', itemId)}
        />
      </div>
    </div>
  );
}
