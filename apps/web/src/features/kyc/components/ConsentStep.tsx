import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ConsentData,
  consentSchema,
  CONTACT_PREFERENCES,
} from '../types';

interface ConsentStepProps {
  data: Partial<ConsentData>;
  onSubmit: (data: ConsentData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ConsentStep({ data, onSubmit, onBack, isSubmitting }: ConsentStepProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsentData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      preferredContact: data.preferredContact || 'email',
      consentGiven: data.consentGiven || false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Contact Preferences & Consent</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Let us know how you'd like to be contacted.
        </p>
      </div>

      {/* Preferred Contact Method */}
      <div>
        <Label>Preferred Contact Method *</Label>
        <Controller
          name="preferredContact"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {CONTACT_PREFERENCES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                    field.value === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-primary/50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        />
        {errors.preferredContact && (
          <p className="mt-2 text-sm text-red-600">{errors.preferredContact.message}</p>
        )}
      </div>

      {/* Consent Checkbox */}
      <div className="rounded-lg border border-gray-200 p-4">
        <Controller
          name="consentGiven"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                    field.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300'
                  )}
                >
                  {field.value && <Check className="h-3 w-3" />}
                </div>
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span className="text-sm leading-relaxed">
                I consent to receive emails and/or texts related to this investment opportunity 
                and scheduling communications. I understand I can opt out at any time. *
              </span>
            </label>
          )}
        />
        {errors.consentGiven && (
          <p className="mt-2 text-sm text-red-600">{errors.consentGiven.message}</p>
        )}
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

