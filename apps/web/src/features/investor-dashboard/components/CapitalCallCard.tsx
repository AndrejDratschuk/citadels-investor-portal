import { DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CapitalCallItem } from '@/lib/api/investors';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';

interface CapitalCallCardProps {
  capitalCall: CapitalCallItem;
  className?: string;
}

export function CapitalCallCard({ capitalCall, className }: CapitalCallCardProps) {
  const remaining = capitalCall.amountDue - capitalCall.amountReceived;
  const isOverdue =
    capitalCall.capitalCall &&
    new Date(capitalCall.capitalCall.deadline) < new Date() &&
    capitalCall.status !== 'complete';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm',
        isOverdue && 'border-red-200 bg-red-50',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isOverdue ? 'bg-red-100' : 'bg-primary/10'
            )}
          >
            <DollarSign
              className={cn('h-5 w-5', isOverdue ? 'text-red-600' : 'text-primary')}
            />
          </div>
          <div>
            <p className="font-semibold">
              {capitalCall.capitalCall?.deal?.name || 'Capital Call'}
            </p>
            {capitalCall.capitalCall && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Due: {formatDate(capitalCall.capitalCall.deadline)}</span>
              </div>
            )}
          </div>
        </div>
        {isOverdue && (
          <div className="flex items-center gap-1 text-sm font-medium text-red-600">
            <AlertCircle className="h-4 w-4" />
            Overdue
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Amount Due</p>
          <p className="mt-0.5 font-semibold">{formatCurrency(capitalCall.amountDue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Received</p>
          <p className="mt-0.5 font-semibold text-green-600">
            {formatCurrency(capitalCall.amountReceived)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p
            className={cn(
              'mt-0.5 font-semibold',
              remaining > 0 ? 'text-orange-600' : 'text-green-600'
            )}
          >
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {remaining > 0 && (
        <div className="mt-4">
          <Button className="w-full" size="sm">
            View Wire Instructions
          </Button>
        </div>
      )}
    </div>
  );
}


