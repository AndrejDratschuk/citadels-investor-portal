import { cn } from '@/lib/utils';
import { formatCurrency } from '@flowveda/shared';

interface CapitalCallProgressProps {
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  deadline: string;
  status: 'draft' | 'sent' | 'partial' | 'funded' | 'closed';
  className?: string;
}

const statusStyles = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-yellow-100 text-yellow-700',
  funded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

export function CapitalCallProgress({
  dealName,
  totalAmount,
  receivedAmount,
  deadline,
  status,
  className,
}: CapitalCallProgressProps) {
  const progress = totalAmount > 0 ? (receivedAmount / totalAmount) * 100 : 0;
  const remaining = totalAmount - receivedAmount;
  const isOverdue = new Date(deadline) < new Date() && status !== 'funded' && status !== 'closed';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-shadow hover:shadow-md',
        isOverdue && 'border-red-200',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{dealName}</h4>
          <p className="text-sm text-muted-foreground">
            Due: {new Date(deadline).toLocaleDateString()}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            statusStyles[status]
          )}
        >
          {status}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress >= 100
                ? 'bg-green-500'
                : progress >= 50
                ? 'bg-blue-500'
                : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="text-muted-foreground">Total</p>
          <p className="font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Received</p>
          <p className="font-semibold text-green-600">{formatCurrency(receivedAmount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Remaining</p>
          <p className={cn('font-semibold', remaining > 0 ? 'text-orange-600' : 'text-green-600')}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}


