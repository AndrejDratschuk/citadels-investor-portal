/**
 * DealSelector Component
 * Dropdown with search for selecting a deal from the user's fund
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Search, Building2, Check } from 'lucide-react';
import { dealsApi, type Deal, statusLabels } from '@/lib/api/deals';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface DealSelectorProps {
  value: string | null;
  onChange: (dealId: string | null, deal: Deal | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowNull?: boolean;
  nullLabel?: string;
  className?: string;
  error?: string;
}

// ============================================
// Status Badge Colors
// ============================================

const statusColors: Record<string, string> = {
  prospective: 'bg-slate-100 text-slate-600',
  under_contract: 'bg-amber-100 text-amber-700',
  acquired: 'bg-emerald-100 text-emerald-700',
  renovating: 'bg-blue-100 text-blue-700',
  stabilized: 'bg-green-100 text-green-700',
  for_sale: 'bg-purple-100 text-purple-700',
  sold: 'bg-gray-100 text-gray-600',
};

// ============================================
// Component
// ============================================

export function DealSelector({
  value,
  onChange,
  placeholder = 'Select a deal...',
  disabled = false,
  allowNull = false,
  nullLabel = 'Fund-level (no specific deal)',
  className,
  error,
}: DealSelectorProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch deals on mount
  useEffect(() => {
    async function fetchDeals(): Promise<void> {
      try {
        setIsLoading(true);
        setFetchError(null);
        const data = await dealsApi.getAll();
        setDeals(data);
      } catch (err) {
        console.error('Failed to fetch deals:', err);
        setFetchError('Failed to load deals');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeals();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedDeal = deals.find((d) => d.id === value) || null;

  // Filter deals based on search
  const filteredDeals = deals.filter((deal) => {
    const searchLower = search.toLowerCase();
    return (
      deal.name.toLowerCase().includes(searchLower) ||
      (deal.address?.city?.toLowerCase().includes(searchLower)) ||
      (deal.propertyType?.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = useCallback((deal: Deal | null): void => {
    onChange(deal?.id || null, deal);
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleToggle = useCallback((): void => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-colors',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white hover:border-slate-300',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          isOpen && !error && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedDeal ? (
            <>
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">{selectedDeal.name}</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  statusColors[selectedDeal.status] || 'bg-slate-100 text-slate-600'
                )}
              >
                {statusLabels[selectedDeal.status] || selectedDeal.status}
              </span>
            </>
          ) : value === null && allowNull ? (
            <span className="text-slate-500">{nullLabel}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[100000] mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search deals..."
                className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : fetchError ? (
              <div className="px-4 py-3 text-center text-sm text-red-500">{fetchError}</div>
            ) : (
              <>
                {/* Null option */}
                {allowNull && (
                  <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50',
                      value === null && 'bg-primary/5'
                    )}
                  >
                    <span className="text-slate-500">{nullLabel}</span>
                    {value === null && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </button>
                )}

                {/* Deals */}
                {filteredDeals.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm text-slate-500">
                    {search ? 'No deals found' : 'No deals available'}
                  </div>
                ) : (
                  filteredDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => handleSelect(deal)}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-slate-50',
                        value === deal.id && 'bg-primary/5'
                      )}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium text-slate-900">{deal.name}</span>
                        <span className="text-xs text-slate-500">
                          {deal.propertyType && `${deal.propertyType} • `}
                          {deal.address?.city && `${deal.address.city}, ${deal.address.state}`}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusColors[deal.status] || 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {statusLabels[deal.status] || deal.status}
                      </span>
                      {value === deal.id && (
                        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DealSelector;









