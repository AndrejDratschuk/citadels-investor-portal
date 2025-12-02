import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TaxSummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function TaxSummaryCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: TaxSummaryCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
