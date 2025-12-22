import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface TaxYearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  className?: string;
}

export function TaxYearSelector({ selectedYear, onYearChange, className }: TaxYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  // Generate last 5 tax years
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            Tax Year {year}
          </option>
        ))}
      </select>
    </div>
  );
}





















