import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { investorsApi } from '@/lib/api/investors';

type CreateInvestorFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  commitmentAmount: string;
};

type FieldErrors = {
  commitmentAmount?: string;
};

function parseCommitmentAmount(input: string): { value: number | undefined; error?: string } {
  const normalized = input.replace(/,/g, '').trim();
  if (!normalized) return { value: undefined };
  const value = Number(normalized);
  if (!Number.isFinite(value)) return { value: undefined, error: 'Please enter a valid number.' };
  if (value < 0) return { value: undefined, error: 'Amount cannot be negative.' };
  return { value };
}

export function CreateInvestor() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateInvestorFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commitmentAmount: '',
  });

  const setField = (key: keyof CreateInvestorFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user starts typing
    if (key === 'commitmentAmount' && fieldErrors.commitmentAmount) {
      setFieldErrors((prev) => ({ ...prev, commitmentAmount: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    // Validate commitment amount
    const { value: commitmentAmount, error: commitmentError } = parseCommitmentAmount(form.commitmentAmount);
    if (commitmentError) {
      setFieldErrors({ commitmentAmount: commitmentError });
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await investorsApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        commitmentAmount,
      });

      navigate(`/manager/investors/${created.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create investor. Please try again.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/manager/investors">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Investors
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Add Investor</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new investor record in your fund
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
            type="email"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            type="tel"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commitmentAmount">Commitment amount (optional)</Label>
          <Input
            id="commitmentAmount"
            value={form.commitmentAmount}
            onChange={(e) => setField('commitmentAmount', e.target.value)}
            inputMode="decimal"
            placeholder="250000"
            className={fieldErrors.commitmentAmount ? 'border-destructive' : ''}
          />
          {fieldErrors.commitmentAmount && (
            <p className="text-sm text-destructive">{fieldErrors.commitmentAmount}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link to="/manager/investors">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Investor'}
          </Button>
        </div>
      </form>
    </div>
  );
}


