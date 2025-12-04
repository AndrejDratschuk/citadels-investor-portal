import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  InvestorTypeData,
  investorTypeSchema,
  INDIVIDUAL_TYPES,
  ENTITY_TYPES,
} from '../types';

interface InvestorTypeStepProps {
  data: Partial<InvestorTypeData>;
  onNext: (data: InvestorTypeData) => void;
}

export function InvestorTypeStep({ data, onNext }: InvestorTypeStepProps) {
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<InvestorTypeData>({
    resolver: zodResolver(investorTypeSchema),
    defaultValues: {
      investorCategory: data.investorCategory || 'individual',
      investorType: data.investorType || 'hnw',
    },
  });

  const investorCategory = watch('investorCategory');
  const investorType = watch('investorType');

  const handleCategoryChange = (category: 'individual' | 'entity') => {
    setValue('investorCategory', category);
    // Reset type to first option of new category
    setValue('investorType', category === 'individual' ? 'hnw' : 'corp_llc');
  };

  const typeOptions = investorCategory === 'individual' ? INDIVIDUAL_TYPES : ENTITY_TYPES;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">What type of investor are you?</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This helps us show you the right form fields and ensure compliance.
        </p>

        {/* Category Selection */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <button
            type="button"
            onClick={() => handleCategoryChange('individual')}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:border-primary/50',
              investorCategory === 'individual'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200'
            )}
          >
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              investorCategory === 'individual'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-500'
            )}>
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold">Individual Investor</p>
              <p className="text-sm text-muted-foreground">
                Personal or joint investment
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleCategoryChange('entity')}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:border-primary/50',
              investorCategory === 'entity'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200'
            )}
          >
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              investorCategory === 'entity'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-500'
            )}>
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold">Entity / Organization</p>
              <p className="text-sm text-muted-foreground">
                LLC, Trust, Corporation, etc.
              </p>
            </div>
          </button>
        </div>

        {/* Type Selection */}
        <div>
          <Label className="text-base font-medium">Select your specific type</Label>
          <div className="mt-3 grid gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('investorType', option.value)}
                className={cn(
                  'flex items-center rounded-lg border px-4 py-3 text-left transition-all hover:border-primary/50',
                  investorType === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200'
                )}
              >
                <div className={cn(
                  'mr-3 h-4 w-4 rounded-full border-2',
                  investorType === option.value
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                )}>
                  {investorType === option.value && (
                    <div className="h-full w-full rounded-full bg-white scale-50" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.investorType && (
            <p className="mt-2 text-sm text-red-600">{errors.investorType.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  );
}

