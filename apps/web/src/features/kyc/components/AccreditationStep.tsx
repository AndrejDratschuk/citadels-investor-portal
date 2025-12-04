import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AccreditationData,
  accreditationSchema,
  ACCREDITATION_OPTIONS,
} from '../types';

interface AccreditationStepProps {
  data: Partial<AccreditationData>;
  onNext: (data: AccreditationData) => void;
  onBack: () => void;
}

export function AccreditationStep({ data, onNext, onBack }: AccreditationStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AccreditationData>({
    resolver: zodResolver(accreditationSchema),
    defaultValues: {
      accreditationBases: data.accreditationBases || [],
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">SEC Accreditation Verification</p>
            <p className="text-sm text-blue-700 mt-1">
              Select <strong>all</strong> that apply. At least <strong>one</strong> selection is required to qualify as an accredited investor.
            </p>
          </div>
        </div>
      </div>

      {/* Accreditation Options */}
      <div>
        <Controller
          name="accreditationBases"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              {ACCREDITATION_OPTIONS.map((option) => {
                const isSelected = field.value.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50',
                      isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange([...field.value, option.id]);
                        } else {
                          field.onChange(field.value.filter((id) => id !== option.id));
                        }
                      }}
                    />
                    <span className="text-sm leading-relaxed">{option.label}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.accreditationBases && (
          <p className="mt-3 text-sm text-red-600">{errors.accreditationBases.message}</p>
        )}
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

