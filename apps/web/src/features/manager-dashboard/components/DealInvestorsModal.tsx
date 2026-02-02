import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, Loader2, Search, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dealsApi, DealInvestor } from '@/lib/api/deals';
import { investorsApi, InvestorProfile } from '@/lib/api/investors';
import { cn } from '@/lib/utils';

interface DealInvestorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealName: string;
}

export function DealInvestorsModal({ isOpen, onClose, dealId, dealName }: DealInvestorsModalProps) {
  const [dealInvestors, setDealInvestors] = useState<DealInvestor[]>([]);
  const [allInvestors, setAllInvestors] = useState<InvestorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add investor form
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [ownershipPercent, setOwnershipPercent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [investors, fundInvestors] = await Promise.all([
          dealsApi.getDealInvestors(dealId),
          investorsApi.getAll(),
        ]);
        setDealInvestors(investors);
        setAllInvestors(fundInvestors);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load investors');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isOpen, dealId]);

  // Filter out investors already in the deal
  const availableInvestors = allInvestors.filter(
    inv => !dealInvestors.some(di => di.id === inv.id)
  );

  // Filter by search
  const filteredInvestors = availableInvestors.filter(inv =>
    `${inv.firstName} ${inv.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOwnership = dealInvestors.reduce((sum, inv) => sum + inv.ownershipPercentage, 0);

  const handleAddInvestor = async () => {
    if (!selectedInvestorId || !ownershipPercent) return;

    const percentage = parseFloat(ownershipPercent) / 100;
    if (percentage <= 0 || percentage > 1) {
      setError('Ownership must be between 0.01% and 100%');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const newInvestor = await dealsApi.addInvestorToDeal(dealId, selectedInvestorId, percentage);
      setDealInvestors(prev => [...prev, newInvestor]);
      setShowAddForm(false);
      setSelectedInvestorId('');
      setOwnershipPercent('');
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to add investor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveInvestor = async (investorId: string) => {
    if (!confirm('Remove this investor from the deal?')) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await dealsApi.removeInvestorFromDeal(dealId, investorId);
      setDealInvestors(prev => prev.filter(inv => inv.id !== investorId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove investor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOwnership = async (investorId: string, newPercentage: number) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await dealsApi.updateDealInvestorOwnership(dealId, investorId, newPercentage / 100);
      setDealInvestors(prev =>
        prev.map(inv =>
          inv.id === investorId ? { ...inv, ownershipPercentage: newPercentage / 100 } : inv
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update ownership');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Manage Deal Investors</h2>
            <p className="text-sm text-muted-foreground">{dealName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6 rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-slate-500" />
                    <span className="font-medium">{dealInvestors.length} Investors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-500" />
                    <span className={cn(
                      'font-medium',
                      totalOwnership > 1 && 'text-red-600'
                    )}>
                      {(totalOwnership * 100).toFixed(1)}% Allocated
                    </span>
                  </div>
                </div>
                {totalOwnership > 1 && (
                  <p className="mt-2 text-sm text-red-600">
                    Warning: Total ownership exceeds 100%
                  </p>
                )}
              </div>

              {/* Current Investors */}
              <div className="space-y-3 mb-6">
                <h3 className="font-medium text-sm text-slate-500 uppercase tracking-wide">
                  Current Investors
                </h3>
                {dealInvestors.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No investors assigned to this deal yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dealInvestors.map(investor => (
                      <div
                        key={investor.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                      >
                        <div>
                          <p className="font-medium">
                            {investor.firstName} {investor.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{investor.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.01"
                              max="100"
                              value={(investor.ownershipPercentage * 100).toFixed(1)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0 && val <= 100) {
                                  handleUpdateOwnership(investor.id, val);
                                }
                              }}
                              className="w-20 text-right"
                              disabled={isSubmitting}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInvestor(investor.id)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Investor */}
              {!showAddForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  className="w-full"
                  disabled={availableInvestors.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {availableInvestors.length === 0 
                    ? 'All investors already assigned' 
                    : 'Add Investor'}
                </Button>
              ) : (
                <div className="rounded-lg border p-4 space-y-4">
                  <h3 className="font-medium">Add Investor to Deal</h3>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search investors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Investor List */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredInvestors.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2 text-center">
                        No investors found
                      </p>
                    ) : (
                      filteredInvestors.map(inv => (
                        <button
                          key={inv.id}
                          onClick={() => setSelectedInvestorId(inv.id)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-lg transition-colors',
                            selectedInvestorId === inv.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-slate-100'
                          )}
                        >
                          <p className="font-medium text-sm">
                            {inv.firstName} {inv.lastName}
                          </p>
                          <p className={cn(
                            'text-xs',
                            selectedInvestorId === inv.id
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}>
                            {inv.email}
                          </p>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Ownership Input */}
                  {selectedInvestorId && (
                    <div className="space-y-2">
                      <Label htmlFor="ownership">Ownership Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="ownership"
                          type="number"
                          step="0.1"
                          min="0.01"
                          max="100"
                          value={ownershipPercent}
                          onChange={(e) => setOwnershipPercent(e.target.value)}
                          placeholder="e.g. 5.0"
                          className="flex-1"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedInvestorId('');
                        setOwnershipPercent('');
                        setSearchQuery('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddInvestor}
                      disabled={!selectedInvestorId || !ownershipPercent || isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Investor'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

