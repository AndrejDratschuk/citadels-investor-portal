/**
 * KPI Category Navigation
 * Pill buttons for navigating between KPI categories
 */

import {
  DollarSign,
  Home,
  TrendingUp,
  BarChart3,
  CreditCard,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KpiCategory } from '@altsui/shared';

// ============================================
// Category Configuration
// ============================================
interface CategoryConfig {
  code: KpiCategory | 'all';
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    code: 'all',
    name: 'All KPIs',
    icon: LayoutGrid,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  {
    code: 'rent_revenue',
    name: 'Rent/Revenue',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    code: 'occupancy',
    name: 'Occupancy',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    code: 'property_performance',
    name: 'Performance',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    code: 'financial',
    name: 'Financial',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  {
    code: 'debt_service',
    name: 'Debt Service',
    icon: CreditCard,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

// ============================================
// Component Props
// ============================================
interface KPICategoryNavProps {
  selected: KpiCategory | 'all';
  onChange: (category: KpiCategory | 'all') => void;
  counts?: Record<KpiCategory | 'all', number>;
  className?: string;
}

// ============================================
// Component
// ============================================
export function KPICategoryNav({
  selected,
  onChange,
  counts,
  className,
}: KPICategoryNavProps): JSX.Element {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selected === cat.code;
        const count = counts?.[cat.code];

        return (
          <button
            key={cat.code}
            onClick={() => onChange(cat.code)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{cat.name}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isSelected ? 'bg-primary-foreground/20' : 'bg-background'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Helper to get category config
// ============================================
export function getCategoryConfig(code: KpiCategory | 'all'): CategoryConfig {
  return CATEGORIES.find((c) => c.code === code) || CATEGORIES[0];
}

export { CATEGORIES };

