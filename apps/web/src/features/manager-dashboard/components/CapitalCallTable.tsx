import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  CreditCard,
  Bell,
  MoreVertical,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';

export interface CapitalCallInvestorItem {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  amountDue: number;
  amountReceived: number;
  status: 'pending' | 'partial' | 'complete' | 'overdue';
  wireReceivedAt: string | null;
  wireConfirmed: boolean;
  wireReference: string | null;
  reminderCount: number;
  lastReminderSent: string | null;
  dueDate: string;
}

interface CapitalCallTableProps {
  items: CapitalCallInvestorItem[];
  onMarkReceived?: (itemId: string, amount?: number) => void;
  onConfirmWire?: (itemId: string, reference: string) => void;
  onSendReminder?: (itemId: string) => void;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Pending',
  },
  partial: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-100',
    label: 'Partial',
  },
  complete: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-100',
    label: 'Paid',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-100',
    label: 'Overdue',
  },
};

interface WireConfirmModalProps {
  item: CapitalCallInvestorItem;
  onConfirm: (reference: string) => void;
  onClose: () => void;
}

function WireConfirmModal({ item, onConfirm, onClose }: WireConfirmModalProps) {
  const [reference, setReference] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Confirm Wire Transfer</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Confirm wire receipt from <strong>{item.investorName}</strong> for{' '}
          <strong>{formatCurrency(item.amountReceived || item.amountDue)}</strong>
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Wire Reference / Transaction ID
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Enter wire reference number"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => onConfirm(reference)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Wire
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CapitalCallTable({
  items,
  onMarkReceived,
  onConfirmWire,
  onSendReminder,
  className,
}: CapitalCallTableProps) {
  const [wireConfirmItem, setWireConfirmItem] = useState<CapitalCallInvestorItem | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const totalDue = items.reduce((sum, item) => sum + item.amountDue, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.amountReceived, 0);
  const confirmedWires = items.filter((item) => item.wireConfirmed).length;
  const overdueCount = items.filter((item) => item.status === 'overdue').length;

  const handleConfirmWire = (reference: string) => {
    if (wireConfirmItem) {
      onConfirmWire?.(wireConfirmItem.id, reference);
      setWireConfirmItem(null);
    }
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Summary Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold">{formatCurrency(totalDue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceived)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Wire Confirmed</p>
            <p className="text-lg font-bold text-blue-600">
              {confirmedWires}/{items.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p
              className={cn(
                'text-lg font-bold',
                totalDue - totalReceived > 0 ? 'text-orange-600' : 'text-green-600'
              )}
            >
              {formatCurrency(totalDue - totalReceived)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {overdueCount > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">
              {overdueCount} investor{overdueCount > 1 ? 's' : ''} overdue - reminders recommended
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 h-7 text-xs border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => {
                items
                  .filter((i) => i.status === 'overdue')
                  .forEach((i) => onSendReminder?.(i.id));
              }}
            >
              <Bell className="mr-1 h-3 w-3" />
              Send All Reminders
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium">Investor</th>
              <th className="p-4 text-right text-sm font-medium">Amount Due</th>
              <th className="p-4 text-right text-sm font-medium">Received</th>
              <th className="p-4 text-center text-sm font-medium">Status</th>
              <th className="p-4 text-center text-sm font-medium">Wire Confirmed</th>
              <th className="p-4 text-center text-sm font-medium">Reminders</th>
              <th className="p-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const StatusIcon = statusConfig[item.status].icon;
              const progress = (item.amountReceived / item.amountDue) * 100;

              return (
                <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  {/* Investor */}
                  <td className="p-4">
                    <Link
                      to={`/manager/investors/${item.investorId}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">{item.investorName}</p>
                      <p className="text-sm text-muted-foreground">{item.investorEmail}</p>
                    </Link>
                  </td>

                  {/* Amount Due */}
                  <td className="p-4 text-right">
                    <p className="font-medium">{formatCurrency(item.amountDue)}</p>
                  </td>

                  {/* Received */}
                  <td className="p-4 text-right">
                    <p
                      className={cn(
                        'font-medium',
                        item.amountReceived > 0 ? 'text-green-600' : 'text-muted-foreground'
                      )}
                    >
                      {formatCurrency(item.amountReceived)}
                    </p>
                    {item.wireReceivedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.wireReceivedAt)}
                      </p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig[item.status].bg,
                          statusConfig[item.status].color
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[item.status].label}
                      </div>
                      {item.status !== 'complete' && (
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              item.status === 'overdue' ? 'bg-red-500' : 'bg-primary'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Wire Confirmed */}
                  <td className="p-4 text-center">
                    {item.wireConfirmed ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 text-green-600">
                          <CreditCard className="h-4 w-4" />
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        {item.wireReference && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {item.wireReference}
                          </span>
                        )}
                      </div>
                    ) : item.amountReceived > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setWireConfirmItem(item)}
                      >
                        <CreditCard className="mr-1 h-3 w-3" />
                        Confirm
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Reminders */}
                  <td className="p-4 text-center">
                    {item.status !== 'complete' ? (
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            item.reminderCount > 0 ? 'text-orange-600' : 'text-muted-foreground'
                          )}
                        >
                          {item.reminderCount} sent
                        </span>
                        {item.lastReminderSent && (
                          <span className="text-xs text-muted-foreground">
                            Last: {formatDate(item.lastReminderSent)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {item.status !== 'complete' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => onMarkReceived?.(item.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'h-8',
                              item.status === 'overdue' && 'text-red-600 hover:text-red-700'
                            )}
                            onClick={() => onSendReminder?.(item.id)}
                            title={`Send reminder${item.reminderCount > 0 ? ` (${item.reminderCount} already sent)` : ''}`}
                          >
                            <Bell className="h-4 w-4" />
                            {item.status === 'overdue' && (
                              <span className="ml-1 text-xs">Remind</span>
                            )}
                          </Button>
                        </>
                      )}
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            setActionMenuOpen(actionMenuOpen === item.id ? null : item.id)
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {actionMenuOpen === item.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white shadow-lg">
                            <div className="p-1">
                              <Link
                                to={`/manager/investors/${item.investorId}`}
                                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => setActionMenuOpen(null)}
                              >
                                View Investor Profile
                              </Link>
                              <button
                                className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => {
                                  window.location.href = `mailto:${item.investorEmail}`;
                                  setActionMenuOpen(null);
                                }}
                              >
                                Send Email
                              </button>
                              {item.amountReceived > 0 && !item.wireConfirmed && (
                                <button
                                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => {
                                    setWireConfirmItem(item);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  Confirm Wire
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Wire Confirm Modal */}
      {wireConfirmItem && (
        <WireConfirmModal
          item={wireConfirmItem}
          onConfirm={handleConfirmWire}
          onClose={() => setWireConfirmItem(null)}
        />
      )}
    </div>
  );
}
