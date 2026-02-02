import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { investorsApi, InvestorProfile, UpdateInvestorInput } from '@/lib/api/investors';

interface EditInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: InvestorProfile;
  onSuccess: (updated: InvestorProfile) => void;
}

export function EditInvestorModal({
  isOpen,
  onClose,
  investor,
  onSuccess,
}: EditInvestorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commitmentAmount: '',
    entityType: '',
    entityName: '',
  });

  // Reset form when modal opens with investor data
  useEffect(() => {
    if (isOpen && investor) {
      setForm({
        firstName: investor.firstName || '',
        lastName: investor.lastName || '',
        email: investor.email || '',
        phone: investor.phone || '',
        commitmentAmount: investor.commitmentAmount ? String(investor.commitmentAmount) : '',
        entityType: investor.entityType || '',
        entityName: investor.entityName || '',
      });
      setError(null);
    }
  }, [isOpen, investor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const updates: UpdateInvestorInput = {};

      // Only include changed fields
      if (form.firstName !== investor.firstName) updates.firstName = form.firstName.trim();
      if (form.lastName !== investor.lastName) updates.lastName = form.lastName.trim();
      if (form.email !== investor.email) updates.email = form.email.trim().toLowerCase();
      if (form.phone !== (investor.phone || '')) {
        updates.phone = form.phone.trim() || null;
      }
      if (form.entityType !== (investor.entityType || '')) {
        updates.entityType = form.entityType || null;
      }
      if (form.entityName !== (investor.entityName || '')) {
        updates.entityName = form.entityName.trim() || null;
      }

      const commitmentNum = form.commitmentAmount ? Number(form.commitmentAmount.replace(/,/g, '')) : 0;
      if (commitmentNum !== investor.commitmentAmount) {
        updates.commitmentAmount = commitmentNum;
      }

      // Only call API if there are changes
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const updated = await investorsApi.update(investor.id, updates);
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update investor';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Edit Investor</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitmentAmount">Commitment amount</Label>
            <Input
              id="commitmentAmount"
              value={form.commitmentAmount}
              onChange={(e) => setField('commitmentAmount', e.target.value)}
              inputMode="decimal"
              placeholder="250000"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity type</Label>
              <select
                id="entityType"
                value={form.entityType}
                onChange={(e) => setField('entityType', e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                <option value="individual">Individual</option>
                <option value="trust">Trust</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityName">Entity name</Label>
              <Input
                id="entityName"
                value={form.entityName}
                onChange={(e) => setField('entityName', e.target.value)}
                disabled={isSubmitting}
                placeholder="If applicable"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

