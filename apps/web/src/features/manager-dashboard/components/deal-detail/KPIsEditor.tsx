import { useState } from 'react';
import { Edit, Save, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { dealsApi, DealKPIs } from '@/lib/api/deals';
import type { DealWithKpis } from './dealDetailMockData';

interface KPIsEditorProps {
  deal: DealWithKpis;
  isRealDeal: boolean;
  onUpdate: (deal: DealWithKpis) => void;
}

function calculateAppreciation(
  acquisitionPrice: number | null | undefined,
  currentValue: number | null | undefined
): number {
  if (!acquisitionPrice || !currentValue) return 0;
  return ((currentValue - acquisitionPrice) / acquisitionPrice) * 100;
}

export function KPIsEditor({ deal, isRealDeal, onUpdate }: KPIsEditorProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [acquisitionPrice, setAcquisitionPrice] = useState(deal.acquisitionPrice?.toString() || '');
  const [acquisitionDate, setAcquisitionDate] = useState(deal.acquisitionDate || '');
  const [currentValue, setCurrentValue] = useState(deal.currentValue?.toString() || '');
  const [noi, setNoi] = useState(deal.kpis?.noi?.toString() || '');
  const [capRate, setCapRate] = useState(deal.kpis?.capRate ? (deal.kpis.capRate * 100).toString() : '');
  const [cashOnCash, setCashOnCash] = useState(deal.kpis?.cashOnCash ? (deal.kpis.cashOnCash * 100).toString() : '');
  const [occupancyRate, setOccupancyRate] = useState(deal.kpis?.occupancyRate ? (deal.kpis.occupancyRate * 100).toString() : '');
  const [renovationBudget, setRenovationBudget] = useState(deal.kpis?.renovationBudget?.toString() || '');
  const [renovationSpent, setRenovationSpent] = useState(deal.kpis?.renovationSpent?.toString() || '');

  const appreciation = calculateAppreciation(deal.acquisitionPrice, deal.currentValue);

  async function handleSave(): Promise<void> {
    if (!isRealDeal) {
      setError('Cannot save KPIs for demo deals. Create a real deal first.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const kpis: DealKPIs = {};
      if (noi) kpis.noi = parseFloat(noi);
      if (capRate) kpis.capRate = parseFloat(capRate) / 100;
      if (cashOnCash) kpis.cashOnCash = parseFloat(cashOnCash) / 100;
      if (occupancyRate) kpis.occupancyRate = parseFloat(occupancyRate) / 100;
      if (renovationBudget) kpis.renovationBudget = parseFloat(renovationBudget);
      if (renovationSpent) kpis.renovationSpent = parseFloat(renovationSpent);

      await dealsApi.update(deal.id, {
        acquisitionPrice: acquisitionPrice ? parseFloat(acquisitionPrice) : undefined,
        acquisitionDate: acquisitionDate || undefined,
        currentValue: currentValue ? parseFloat(currentValue) : undefined,
        kpis: Object.keys(kpis).length > 0 ? kpis : undefined,
      });

      // Update local state
      onUpdate({
        ...deal,
        acquisitionPrice: acquisitionPrice ? parseFloat(acquisitionPrice) : null,
        acquisitionDate: acquisitionDate || null,
        currentValue: currentValue ? parseFloat(currentValue) : null,
        kpis: Object.keys(kpis).length > 0 ? kpis : deal.kpis,
      });

      setIsEditing(false);
    } catch (err: unknown) {
      console.error('Failed to save KPIs:', err);
      const message = err instanceof Error ? err.message : 'Failed to save KPIs. Please try again.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel(): void {
    // Reset form state
    setAcquisitionPrice(deal.acquisitionPrice?.toString() || '');
    setAcquisitionDate(deal.acquisitionDate || '');
    setCurrentValue(deal.currentValue?.toString() || '');
    setNoi(deal.kpis?.noi?.toString() || '');
    setCapRate(deal.kpis?.capRate ? (deal.kpis.capRate * 100).toString() : '');
    setCashOnCash(deal.kpis?.cashOnCash ? (deal.kpis.cashOnCash * 100).toString() : '');
    setOccupancyRate(deal.kpis?.occupancyRate ? (deal.kpis.occupancyRate * 100).toString() : '');
    setRenovationBudget(deal.kpis?.renovationBudget?.toString() || '');
    setRenovationSpent(deal.kpis?.renovationSpent?.toString() || '');
    setIsEditing(false);
    setError(null);
  }

  if (!isEditing) {
    return (
      <KPIsDisplayView
        deal={deal}
        appreciation={appreciation}
        isRealDeal={isRealDeal}
        onEdit={() => setIsEditing(true)}
      />
    );
  }

  return (
    <KPIsEditForm
      acquisitionPrice={acquisitionPrice}
      acquisitionDate={acquisitionDate}
      currentValue={currentValue}
      noi={noi}
      capRate={capRate}
      cashOnCash={cashOnCash}
      occupancyRate={occupancyRate}
      renovationBudget={renovationBudget}
      renovationSpent={renovationSpent}
      isSaving={isSaving}
      error={error}
      onAcquisitionPriceChange={setAcquisitionPrice}
      onAcquisitionDateChange={setAcquisitionDate}
      onCurrentValueChange={setCurrentValue}
      onNoiChange={setNoi}
      onCapRateChange={setCapRate}
      onCashOnCashChange={setCashOnCash}
      onOccupancyRateChange={setOccupancyRate}
      onRenovationBudgetChange={setRenovationBudget}
      onRenovationSpentChange={setRenovationSpent}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

// ============================================
// Sub-components
// ============================================
interface KPIsDisplayViewProps {
  deal: DealWithKpis;
  appreciation: number;
  isRealDeal: boolean;
  onEdit: () => void;
}

function KPIsDisplayView({ deal, appreciation, isRealDeal, onEdit }: KPIsDisplayViewProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit KPIs
        </Button>
      </div>

      {/* Valuation Summary - Featured */}
      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Acquisition Info */}
          <div>
            <p className="text-sm font-medium text-primary/60">Acquisition Price</p>
            <p className="mt-1 text-2xl font-bold">
              {deal.acquisitionPrice ? formatCurrency(deal.acquisitionPrice) : '—'}
            </p>
            {deal.acquisitionDate && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(deal.acquisitionDate)}
              </p>
            )}
          </div>
          {/* Current Value */}
          <div>
            <p className="text-sm font-medium text-primary/80">Current Value (AUM)</p>
            <p className="mt-1 text-2xl font-bold">
              {deal.currentValue ? formatCurrency(deal.currentValue) : '—'}
            </p>
            {deal.acquisitionPrice && deal.currentValue && (
              <p
                className={cn(
                  'mt-1 text-sm font-medium',
                  appreciation >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {appreciation >= 0 ? '+' : ''}
                {appreciation.toFixed(1)}% appreciation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Other KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiDisplayCard label="NOI (Annual)" value={deal.kpis?.noi} format="currency" />
        <KpiDisplayCard label="Cap Rate" value={deal.kpis?.capRate} format="percentage" />
        <KpiDisplayCard label="Cash on Cash" value={deal.kpis?.cashOnCash} format="percentage" />
        <KpiDisplayCard label="Occupancy Rate" value={deal.kpis?.occupancyRate} format="percentage" decimals={0} />
        <KpiDisplayCard label="Renovation Budget" value={deal.kpis?.renovationBudget} format="currency" />
        <KpiDisplayCard label="Renovation Spent" value={deal.kpis?.renovationSpent} format="currency" />
      </div>

      {!isRealDeal && <DemoModeWarning />}
    </div>
  );
}

interface KpiDisplayCardProps {
  label: string;
  value: number | undefined;
  format: 'currency' | 'percentage';
  decimals?: number;
}

function KpiDisplayCard({ label, value, format, decimals = 2 }: KpiDisplayCardProps): JSX.Element {
  function formatValue(): string {
    if (value === undefined || value === null) return '—';
    if (format === 'currency') return formatCurrency(value);
    return `${(value * 100).toFixed(decimals)}%`;
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{formatValue()}</p>
    </div>
  );
}

function DemoModeWarning(): JSX.Element {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
      <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="text-sm">
        <p className="font-medium text-amber-800 dark:text-amber-200">Demo Mode</p>
        <p className="text-amber-600 dark:text-amber-400">
          This is sample data. KPIs can only be edited for deals saved in the database.
        </p>
      </div>
    </div>
  );
}

interface KPIsEditFormProps {
  acquisitionPrice: string;
  acquisitionDate: string;
  currentValue: string;
  noi: string;
  capRate: string;
  cashOnCash: string;
  occupancyRate: string;
  renovationBudget: string;
  renovationSpent: string;
  isSaving: boolean;
  error: string | null;
  onAcquisitionPriceChange: (value: string) => void;
  onAcquisitionDateChange: (value: string) => void;
  onCurrentValueChange: (value: string) => void;
  onNoiChange: (value: string) => void;
  onCapRateChange: (value: string) => void;
  onCashOnCashChange: (value: string) => void;
  onOccupancyRateChange: (value: string) => void;
  onRenovationBudgetChange: (value: string) => void;
  onRenovationSpentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function KPIsEditForm({
  acquisitionPrice,
  acquisitionDate,
  currentValue,
  noi,
  capRate,
  cashOnCash,
  occupancyRate,
  renovationBudget,
  renovationSpent,
  isSaving,
  error,
  onAcquisitionPriceChange,
  onAcquisitionDateChange,
  onCurrentValueChange,
  onNoiChange,
  onCapRateChange,
  onCashOnCashChange,
  onOccupancyRateChange,
  onRenovationBudgetChange,
  onRenovationSpentChange,
  onSave,
  onCancel,
}: KPIsEditFormProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit KPIs</h3>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" size="sm" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} size="sm" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save KPIs
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Acquisition Price */}
          <div>
            <Label htmlFor="acquisitionPrice" className="text-base font-medium">
              Acquisition Price
            </Label>
            <Input
              id="acquisitionPrice"
              type="number"
              value={acquisitionPrice}
              onChange={(e) => onAcquisitionPriceChange(e.target.value)}
              placeholder="e.g. 12500000"
              className="mt-2"
            />
          </div>

          {/* Acquisition Date */}
          <div>
            <Label htmlFor="acquisitionDate" className="text-base font-medium">
              Acquisition Date
            </Label>
            <Input
              id="acquisitionDate"
              type="date"
              value={acquisitionDate}
              onChange={(e) => onAcquisitionDateChange(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Current Value */}
          <div>
            <Label htmlFor="currentValue" className="text-base font-medium">
              Current Value (AUM)
            </Label>
            <Input
              id="currentValue"
              type="number"
              value={currentValue}
              onChange={(e) => onCurrentValueChange(e.target.value)}
              placeholder="e.g. 14200000"
              className="mt-2"
            />
          </div>

          {/* Divider */}
          <div className="sm:col-span-2 lg:col-span-3 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Performance Metrics</p>
          </div>

          {/* NOI */}
          <div>
            <Label htmlFor="noi">NOI (Annual)</Label>
            <Input
              id="noi"
              type="number"
              value={noi}
              onChange={(e) => onNoiChange(e.target.value)}
              placeholder="e.g. 985000"
              className="mt-2"
            />
          </div>

          {/* Cap Rate */}
          <div>
            <Label htmlFor="capRate">Cap Rate (%)</Label>
            <Input
              id="capRate"
              type="number"
              step="0.01"
              value={capRate}
              onChange={(e) => onCapRateChange(e.target.value)}
              placeholder="e.g. 6.93"
              className="mt-2"
            />
          </div>

          {/* Cash on Cash */}
          <div>
            <Label htmlFor="cashOnCash">Cash on Cash (%)</Label>
            <Input
              id="cashOnCash"
              type="number"
              step="0.01"
              value={cashOnCash}
              onChange={(e) => onCashOnCashChange(e.target.value)}
              placeholder="e.g. 8.2"
              className="mt-2"
            />
          </div>

          {/* Occupancy Rate */}
          <div>
            <Label htmlFor="occupancyRate">Occupancy Rate (%)</Label>
            <Input
              id="occupancyRate"
              type="number"
              step="1"
              value={occupancyRate}
              onChange={(e) => onOccupancyRateChange(e.target.value)}
              placeholder="e.g. 94"
              className="mt-2"
            />
          </div>

          {/* Renovation Budget */}
          <div>
            <Label htmlFor="renovationBudget">Renovation Budget</Label>
            <Input
              id="renovationBudget"
              type="number"
              value={renovationBudget}
              onChange={(e) => onRenovationBudgetChange(e.target.value)}
              placeholder="e.g. 1500000"
              className="mt-2"
            />
          </div>

          {/* Renovation Spent */}
          <div>
            <Label htmlFor="renovationSpent">Renovation Spent</Label>
            <Input
              id="renovationSpent"
              type="number"
              value={renovationSpent}
              onChange={(e) => onRenovationSpentChange(e.target.value)}
              placeholder="e.g. 1200000"
              className="mt-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
