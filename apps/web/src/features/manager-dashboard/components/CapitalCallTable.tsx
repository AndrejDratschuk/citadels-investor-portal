import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertCircle, Mail, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';

export interface CapitalCallInvestorItem {
  id: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  amountDue: number;
  amountReceived: number;
  status: 'pending' | 'partial' | 'complete';
  wireReceivedAt: string | null;
  reminderCount: number;
}

interface CapitalCallTableProps {
  items: CapitalCallInvestorItem[];
  onMarkReceived?: (itemId: string) => void;
  onSendReminder?: (itemId: string) => void;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  partial: AlertCircle,
  complete: CheckCircle2,
};

const statusStyles = {
  pending: 'text-yellow-500',
  partial: 'text-orange-500',
  complete: 'text-green-500',
};

export function CapitalCallTable({
  items,
  onMarkReceived,
  onSendReminder,
  className,
}: CapitalCallTableProps) {
  const totalDue = items.reduce((sum, item) => sum + item.amountDue, 0);
  const totalReceived = items.reduce((sum, item) => sum + item.amountReceived, 0);

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Summary Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Due</p>
            <p className="text-lg font-bold">{formatCurrency(totalDue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalReceived)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className={cn(
              'text-lg font-bold',
              totalDue - totalReceived > 0 ? 'text-orange-600' : 'text-green-600'
            )}>
              {formatCurrency(totalDue - totalReceived)}
            </p>
          </div>
        </div>
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
              <th className="p-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const StatusIcon = statusIcons[item.status];
              const remaining = item.amountDue - item.amountReceived;
              const progress = (item.amountReceived / item.amountDue) * 100;

              return (
                <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="p-4">
                    <Link
                      to={`/manager/investors/${item.investorId}`}
                      className="hover:underline"
                    >
                      <p className="font-medium">{item.investorName}</p>
                      <p className="text-sm text-muted-foreground">{item.investorEmail}</p>
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-medium">{formatCurrency(item.amountDue)}</p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="font-medium text-green-600">
                      {formatCurrency(item.amountReceived)}
                    </p>
                    {item.wireReceivedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.wireReceivedAt)}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-center gap-1">
                      <StatusIcon className={cn('h-5 w-5', statusStyles[item.status])} />
                      <span className="text-xs capitalize">{item.status}</span>
                      {item.status !== 'complete' && (
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {item.status !== 'complete' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkReceived?.(item.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Mark Received
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendReminder?.(item.id)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


