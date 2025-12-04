import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  BankingInfoData,
  bankingInfoSchema,
  DISTRIBUTION_METHODS,
  ACCOUNT_TYPES,
} from '../types';

interface BankingInfoStepProps {
  data: Partial<BankingInfoData>;
  onSubmit: (data: BankingInfoData) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function BankingInfoStep({ data, onSubmit, onBack, isSubmitting }: BankingInfoStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BankingInfoData>({
    resolver: zodResolver(bankingInfoSchema),
    defaultValues: {
      distributionMethod: data.distributionMethod || 'wire',
      bankName: data.bankName || '',
      bankAddress: data.bankAddress || '',
      routingNumber: data.routingNumber || '',
      accountNumber: data.accountNumber || '',
      accountType: data.accountType || 'checking',
      beneficiaryName: data.beneficiaryName || '',
      beneficiaryInfo: data.beneficiaryInfo || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Banking Information</h3>
          <p className="text-sm text-muted-foreground">
            For distribution payments
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Your information is secure</p>
            <p className="text-sm text-blue-700 mt-1">
              Banking details are encrypted and only used for distributions. We never share your information with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Method */}
      <div>
        <Label>Preferred Distribution Method *</Label>
        <Controller
          name="distributionMethod"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {DISTRIBUTION_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => field.onChange(method.value)}
                  className={cn(
                    'rounded-lg border px-4 py-3 text-sm font-medium transition-all',
                    field.value === method.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
          )}
        />
        {errors.distributionMethod && (
          <p className="mt-1 text-sm text-red-600">{errors.distributionMethod.message}</p>
        )}
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            {...register('bankName')}
            placeholder="Chase Bank"
            className="mt-1.5"
          />
          {errors.bankName && (
            <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bankAddress">Bank Address *</Label>
          <Input
            id="bankAddress"
            {...register('bankAddress')}
            placeholder="123 Main St, New York, NY 10001"
            className="mt-1.5"
          />
          {errors.bankAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.bankAddress.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="routingNumber">ABA Routing Number *</Label>
            <Input
              id="routingNumber"
              {...register('routingNumber')}
              placeholder="123456789"
              maxLength={9}
              className="mt-1.5"
            />
            {errors.routingNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.routingNumber.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              {...register('accountNumber')}
              placeholder="••••••••1234"
              className="mt-1.5"
            />
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Account Type *</Label>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                      field.value === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          />
          {errors.accountType && (
            <p className="mt-1 text-sm text-red-600">{errors.accountType.message}</p>
          )}
        </div>
      </div>

      {/* Beneficiary Information */}
      <div className="border-t pt-6 space-y-4">
        <h4 className="font-medium">Beneficiary Information</h4>
        
        <div>
          <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
          <Input
            id="beneficiaryName"
            {...register('beneficiaryName')}
            placeholder="John Smith"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Name as it appears on the bank account
          </p>
          {errors.beneficiaryName && (
            <p className="mt-1 text-sm text-red-600">{errors.beneficiaryName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="beneficiaryInfo">Additional Beneficiary Info (Optional)</Label>
          <textarea
            id="beneficiaryInfo"
            {...register('beneficiaryInfo')}
            placeholder="Any additional notes for wire transfers..."
            rows={3}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>
    </form>
  );
}

