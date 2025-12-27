import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { TaxAccreditationData, taxAccreditationSchema, ACCREDITATION_TYPES } from '../types';

interface TaxAccreditationStepProps {
  data: Partial<TaxAccreditationData>;
  onNext: (data: TaxAccreditationData) => void;
  onBack: () => void;
}

export function TaxAccreditationStep({ data, onNext, onBack }: TaxAccreditationStepProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaxAccreditationData>({
    resolver: zodResolver(taxAccreditationSchema),
    defaultValues: data,
  });

  const taxIdType = watch('taxIdType');

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Security Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Your information is secure</p>
            <p className="text-sm text-blue-700 mt-1">
              We only store the last 4 digits of your Tax ID. Your full SSN/EIN is never stored in our database.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="taxResidency">Tax Residency (Country) *</Label>
        <Input
          id="taxResidency"
          {...register('taxResidency')}
          placeholder="United States"
          className="mt-1.5"
        />
        {errors.taxResidency && (
          <p className="mt-1 text-sm text-red-600">{errors.taxResidency.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="taxIdType">Tax ID Type *</Label>
          <select
            id="taxIdType"
            {...register('taxIdType')}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="ssn">SSN (Social Security Number)</option>
            <option value="ein">EIN (Employer Identification Number)</option>
          </select>
          {errors.taxIdType && (
            <p className="mt-1 text-sm text-red-600">{errors.taxIdType.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="taxIdNumber">
            {taxIdType === 'ein' ? 'EIN' : 'SSN'} *
          </Label>
          <Input
            id="taxIdNumber"
            {...register('taxIdNumber')}
            placeholder={taxIdType === 'ein' ? '12-3456789' : '123-45-6789'}
            maxLength={11}
            className="mt-1.5"
            autoComplete="off"
          />
          {errors.taxIdNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.taxIdNumber.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {taxIdType === 'ein' ? 'Format: XX-XXXXXXX' : 'Format: XXX-XX-XXXX'}
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Accreditation Status</h3>
        <p className="text-sm text-muted-foreground mb-4">
          SEC regulations require investors to be accredited. Please select how you qualify:
        </p>
        
        <div>
          <Label htmlFor="accreditationType">Accreditation Basis *</Label>
          <select
            id="accreditationType"
            {...register('accreditationType')}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {ACCREDITATION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.accreditationType && (
            <p className="mt-1 text-sm text-red-600">{errors.accreditationType.message}</p>
          )}
        </div>

        <div className="mt-4">
          <Label htmlFor="accreditationDetails">Additional Details (Optional)</Label>
          <textarea
            id="accreditationDetails"
            {...register('accreditationDetails')}
            placeholder="Provide any additional information about your accreditation status..."
            rows={3}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}






























