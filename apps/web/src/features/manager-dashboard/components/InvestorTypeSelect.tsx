import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  INVESTOR_TYPE,
  INVESTOR_TYPE_LABELS,
  INVESTOR_TYPE_SHORT_LABELS,
  type InvestorType,
} from '@altsui/shared';

interface InvestorTypeSelectProps {
  value: InvestorType;
  onChange: (value: InvestorType) => void;
  disabled?: boolean;
  className?: string;
  /** Use short labels like "LP", "GP" instead of full names */
  shortLabels?: boolean;
  /** Show a placeholder option */
  placeholder?: string;
}

const INVESTOR_TYPES = Object.values(INVESTOR_TYPE) as InvestorType[];

export function InvestorTypeSelect({
  value,
  onChange,
  disabled = false,
  className,
  shortLabels = false,
  placeholder,
}: InvestorTypeSelectProps) {
  const labels = shortLabels ? INVESTOR_TYPE_SHORT_LABELS : INVESTOR_TYPE_LABELS;

  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as InvestorType)}
        disabled={disabled}
        className={cn(
          'w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm',
          'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {INVESTOR_TYPES.map((type) => (
          <option key={type} value={type}>
            {labels[type]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** Badge component for displaying investor type in tables/lists */
interface InvestorTypeBadgeProps {
  type: InvestorType;
  className?: string;
}

const TYPE_BADGE_COLORS: Record<InvestorType, string> = {
  limited_partner: 'bg-blue-100 text-blue-800',
  general_partner: 'bg-purple-100 text-purple-800',
  series_a: 'bg-green-100 text-green-800',
  series_b: 'bg-teal-100 text-teal-800',
  series_c: 'bg-cyan-100 text-cyan-800',
  institutional: 'bg-indigo-100 text-indigo-800',
  individual_accredited: 'bg-amber-100 text-amber-800',
  family_office: 'bg-rose-100 text-rose-800',
  custom: 'bg-gray-100 text-gray-800',
};

export function InvestorTypeBadge({ type, className }: InvestorTypeBadgeProps) {
  const colorClass = TYPE_BADGE_COLORS[type] || TYPE_BADGE_COLORS.custom;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {INVESTOR_TYPE_SHORT_LABELS[type]}
    </span>
  );
}


