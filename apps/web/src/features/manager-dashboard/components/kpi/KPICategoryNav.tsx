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
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KpiCategory } from '@altsui/shared';

// ============================================
// Category Configuration
// ============================================
export type KpiCategoryNavOption = KpiCategory | 'all' | 'outliers';

interface CategoryConfig {
  code: KpiCategoryNavOption;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  highlight?: boolean;
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
  {
    code: 'outliers',
    name: 'Outliers',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

// ============================================
// Component Props
// ============================================
interface KPICategoryNavProps {
  selected: KpiCategoryNavOption;
  onChange: (category: KpiCategoryNavOption) => void;
  counts?: Partial<Record<KpiCategoryNavOption, number>>;
  showOutliers?: boolean;
  className?: string;
}

// ============================================
// Component
// ============================================
export function KPICategoryNav({
  selected,
  onChange,
  counts,
  showOutliers = true,
  className,
}: KPICategoryNavProps): JSX.Element {
  const visibleCategories = showOutliers 
    ? CATEGORIES 
    : CATEGORIES.filter(c => c.code !== 'outliers');

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleCategories.map((cat) => {
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
                ? cat.highlight
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-primary text-primary-foreground shadow-sm'
                : cat.highlight
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 ring-1 ring-amber-300'
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
export function getCategoryConfig(code: KpiCategoryNavOption): CategoryConfig {
  return CATEGORIES.find((c) => c.code === code) || CATEGORIES[1]; // Default to 'all'
}

export { CATEGORIES };

