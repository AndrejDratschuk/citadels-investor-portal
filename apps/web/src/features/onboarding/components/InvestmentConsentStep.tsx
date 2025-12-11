import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, FileText, Shield, AlertCircle } from 'lucide-react';
import { InvestmentConsentData, investmentConsentSchema } from '../types';
import { formatCurrency } from '@flowveda/shared';

interface InvestmentConsentStepProps {
  data: Partial<InvestmentConsentData>;
  onSubmit: (data: InvestmentConsentData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function InvestmentConsentStep({ data, onSubmit, onBack, isSubmitting }: InvestmentConsentStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvestmentConsentData>({
    resolver: zodResolver(investmentConsentSchema),
    defaultValues: {
      ...data,
      consent: data.consent ?? false,
    },
  });

  const commitmentAmount = watch('commitmentAmount');
  const consent = watch('consent');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="commitmentAmount">Commitment Amount *</Label>
        <div className="relative mt-1.5">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="commitmentAmount"
            type="number"
            {...register('commitmentAmount', { valueAsNumber: true })}
            placeholder="100000"
            className="pl-9"
            min={25000}
            step={1000}
          />
        </div>
        {errors.commitmentAmount && (
          <p className="mt-1 text-sm text-red-600">{errors.commitmentAmount.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Minimum investment: $25,000
        </p>
      </div>

      {commitmentAmount && commitmentAmount >= 25000 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Your commitment</p>
          <p className="text-2xl font-bold">{formatCurrency(commitmentAmount)}</p>
        </div>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Terms & Acknowledgments</h3>
        
        {/* Key Points */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Subscription Agreement</p>
              <p className="text-xs text-muted-foreground">
                Upon approval, you will receive a subscription agreement via DocuSign for electronic signature.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Accredited Investor Verification</p>
              <p className="text-xs text-muted-foreground">
                Your accreditation status may be verified by a third-party verification service.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Investment Risk</p>
              <p className="text-xs text-muted-foreground">
                Private fund investments involve significant risk and are suitable only for investors who can bear the loss of their entire investment.
              </p>
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('consent')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">
              I confirm that I am an accredited investor and have read and agree to the{' '}
              <a href="#" className="text-primary underline">Terms of Service</a>,{' '}
              <a href="#" className="text-primary underline">Privacy Policy</a>, and{' '}
              <a href="#" className="text-primary underline">Risk Disclosures</a>.
              I understand that my application will be reviewed and I will receive a subscription agreement upon approval.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-2 text-sm text-red-600">{errors.consent.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={!consent || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}













