import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Users, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Mock deals data
const mockDeals = [
  { id: '1', name: 'Riverside Apartments', totalCommitment: 14000000 },
  { id: '2', name: 'Downtown Office Tower', totalCommitment: 29000000 },
  { id: '3', name: 'Eastside Industrial Park', totalCommitment: 20000000 },
  { id: '4', name: 'Lakefront Retail Center', totalCommitment: 10000000 },
];

// Mock investors for preview
const mockInvestorBreakdown = [
  { id: '1', name: 'John Smith', ownershipPercent: 0.05, amount: 0 },
  { id: '2', name: 'Sarah Johnson', ownershipPercent: 0.035, amount: 0 },
  { id: '3', name: 'Michael Chen', ownershipPercent: 0.10, amount: 0 },
  { id: '4', name: 'Emily Davis', ownershipPercent: 0.075, amount: 0 },
  { id: '5', name: 'Robert Wilson', ownershipPercent: 0.04, amount: 0 },
];

type Step = 'deal' | 'amount' | 'preview';

export function CreateCapitalCall() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('deal');
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const selectedDeal = mockDeals.find((d) => d.id === selectedDealId);

  const investorBreakdown = mockInvestorBreakdown.map((investor) => ({
    ...investor,
    amount: parseFloat(amount || '0') * investor.ownershipPercent,
  }));

  const handleNext = () => {
    if (step === 'deal' && selectedDealId) {
      setStep('amount');
    } else if (step === 'amount' && amount && deadline) {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'amount') setStep('deal');
    if (step === 'preview') setStep('amount');
  };

  const handleSubmit = () => {
    // Submit logic here
    console.log({ dealId: selectedDealId, amount, deadline });
    navigate('/manager/capital-calls');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/capital-calls">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Capital Calls
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Capital Call</h1>
        <p className="mt-1 text-muted-foreground">
          Request capital from investors for a deal
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {(['deal', 'amount', 'preview'] as const).map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : index < ['deal', 'amount', 'preview'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                'ml-2 text-sm font-medium capitalize',
                step === s ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {s === 'deal' ? 'Select Deal' : s === 'amount' ? 'Set Amount' : 'Review'}
            </span>
            {index < 2 && <ChevronRight className="mx-4 h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'deal' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Select a Deal</h2>
          <p className="text-muted-foreground">
            Choose the deal you want to create a capital call for.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockDeals.map((deal) => (
              <button
                key={deal.id}
                onClick={() => setSelectedDealId(deal.id)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all',
                  selectedDealId === deal.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'hover:border-primary/50 hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{deal.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Total Commitment: {formatCurrency(deal.totalCommitment)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'amount' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Selected Deal</p>
            <p className="font-semibold">{selectedDeal?.name}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Capital Call Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500000"
              />
              <p className="text-xs text-muted-foreground">
                Enter the total amount to call from all investors
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Payment Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Investors will be asked to wire funds by this date
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">Capital Call Summary</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Deal</p>
                <p className="font-medium">{selectedDeal?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium">{formatCurrency(parseFloat(amount || '0'))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">
                  {deadline ? new Date(deadline).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Investor Breakdown */}
          <div className="rounded-xl border bg-card">
            <div className="border-b p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Investor Breakdown</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Each investor will receive their proportional share based on ownership
              </p>
            </div>
            <div className="divide-y">
              {investorBreakdown.map((investor) => (
                <div
                  key={investor.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <p className="font-medium">{investor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(investor.ownershipPercent * 100).toFixed(1)}% ownership
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(investor.amount)}</p>
                </div>
              ))}
            </div>
            <div className="border-t bg-muted/30 p-4">
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(parseFloat(amount || '0'))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step === 'deal'}>
          Back
        </Button>
        {step !== 'preview' ? (
          <Button
            onClick={handleNext}
            disabled={
              (step === 'deal' && !selectedDealId) ||
              (step === 'amount' && (!amount || !deadline))
            }
          >
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit}>
            Create & Send Capital Call
          </Button>
        )}
      </div>
    </div>
  );
}


