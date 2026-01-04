import { useState } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@altsui/shared';
import type { DealSummary } from '@/lib/api/reports';

interface DealSelectorProps {
  deals: DealSummary[];
  selectedDealIds: string[];
  onSelectionChange: (dealIds: string[]) => void;
  isLoading?: boolean;
}

export function DealSelector({
  deals,
  selectedDealIds,
  onSelectionChange,
  isLoading = false,
}: DealSelectorProps) {
  const [open, setOpen] = useState(false);

  const allSelected = selectedDealIds.length === deals.length && deals.length > 0;
  const noneSelected = selectedDealIds.length === 0;

  const handleToggleDeal = (dealId: string) => {
    if (selectedDealIds.includes(dealId)) {
      onSelectionChange(selectedDealIds.filter((id) => id !== dealId));
    } else {
      onSelectionChange([...selectedDealIds, dealId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(deals.map((d) => d.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getButtonLabel = () => {
    if (isLoading) return 'Loading deals...';
    if (allSelected) return 'All Deals';
    if (noneSelected) return 'Select Deals';
    if (selectedDealIds.length === 1) {
      const deal = deals.find((d) => d.id === selectedDealIds[0]);
      return deal?.name || '1 Deal';
    }
    return `${selectedDealIds.length} Deals`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[280px] justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            {getButtonLabel()}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        {/* Header with Select All / Clear All */}
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedDealIds.length} of {deals.length} selected
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelectAll}
              disabled={allSelected}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleClearAll}
              disabled={noneSelected}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Deal List */}
        <div className="max-h-[300px] overflow-y-auto">
          {deals.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No deals found
            </div>
          ) : (
            deals.map((deal) => {
              const isSelected = selectedDealIds.includes(deal.id);
              return (
                <button
                  key={deal.id}
                  onClick={() => handleToggleDeal(deal.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent',
                    isSelected && 'bg-accent/50'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Deal Info */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{deal.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {deal.propertyType && (
                        <span className="capitalize">{deal.propertyType}</span>
                      )}
                      {deal.currentValue && (
                        <>
                          <span>•</span>
                          <span>{formatCurrency(deal.currentValue)}</span>
                        </>
                      )}
                      {deal.unitCount && (
                        <>
                          <span>•</span>
                          <span>{deal.unitCount} units</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

