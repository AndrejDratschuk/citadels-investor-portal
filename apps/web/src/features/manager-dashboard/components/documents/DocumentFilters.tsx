import { Search, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  typeLabels,
  departmentLabels,
  documentStatusLabels,
} from '@/lib/api/documents';
import { DealOption, InvestorOption, DocumentFiltersState } from './types';

interface DocumentFiltersProps {
  filters: DocumentFiltersState;
  onFilterChange: (key: keyof DocumentFiltersState, value: string | null) => void;
  onClearFilters: () => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  deals?: DealOption[];
  investors?: InvestorOption[];
  showDealInvestorFilters?: boolean;
  searchPlaceholder?: string;
}

export function DocumentFilters({
  filters,
  onFilterChange,
  onClearFilters,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  deals = [],
  investors = [],
  showDealInvestorFilters = false,
  searchPlaceholder = 'Search documents...',
}: DocumentFiltersProps) {
  const hasActiveFilters =
    filters.dealFilter ||
    filters.investorFilter ||
    filters.departmentFilter ||
    filters.statusFilter ||
    filters.typeFilter !== 'all';

  const activeFilterCount = [
    filters.dealFilter,
    filters.investorFilter,
    filters.departmentFilter,
    filters.statusFilter,
    filters.typeFilter !== 'all' ? filters.typeFilter : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAdvancedFilters}
            className={cn(hasActiveFilters && 'border-primary text-primary')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1.5 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={cn('h-4 w-4 ml-1 transition-transform', showAdvancedFilters && 'rotate-180')}
            />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <select
                value={filters.typeFilter}
                onChange={(e) => onFilterChange('typeFilter', e.target.value)}
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {showDealInvestorFilters && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Deal</Label>
                  <select
                    value={filters.dealFilter || ''}
                    onChange={(e) => onFilterChange('dealFilter', e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Deals</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Investor</Label>
                  <select
                    value={filters.investorFilter || ''}
                    onChange={(e) => onFilterChange('investorFilter', e.target.value || null)}
                    className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Investors</option>
                    {investors.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.firstName} {inv.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Department</Label>
              <select
                value={filters.departmentFilter || ''}
                onChange={(e) => onFilterChange('departmentFilter', e.target.value || null)}
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
              >
                <option value="">All Departments</option>
                {Object.entries(departmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <select
                value={filters.statusFilter || ''}
                onChange={(e) => onFilterChange('statusFilter', e.target.value || null)}
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
              >
                <option value="">All Statuses</option>
                {Object.entries(documentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

