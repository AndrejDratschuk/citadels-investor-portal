import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  InvestmentIntentData,
  investmentIntentSchema,
  TIMELINE_OPTIONS,
  INVESTMENT_GOALS,
  LIKELIHOOD_OPTIONS,
} from '../types';

interface InvestmentIntentStepProps {
  data: Partial<InvestmentIntentData>;
  onNext: (data: InvestmentIntentData) => void;
  onBack: () => void;
}

export function InvestmentIntentStep({ data, onNext, onBack }: InvestmentIntentStepProps) {
  const {
    register,
    control,
    handleSubmit,
  } = useForm<InvestmentIntentData>({
    resolver: zodResolver(investmentIntentSchema),
    defaultValues: {
      indicativeCommitment: data.indicativeCommitment || undefined,
      timeline: data.timeline || undefined,
      investmentGoals: data.investmentGoals || [],
      likelihood: data.likelihood || undefined,
      questionsForManager: data.questionsForManager || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Investment Intent</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Help us understand your investment goals. All fields are optional.
        </p>
      </div>

      {/* Indicative Commitment */}
      <div>
        <Label htmlFor="indicativeCommitment">Indicative Commitment Amount ($)</Label>
        <Input
          id="indicativeCommitment"
          type="number"
          {...register('indicativeCommitment', { valueAsNumber: true })}
          placeholder="100000"
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This is not a binding commitment
        </p>
      </div>

      {/* Timeline */}
      <div>
        <Label>Timeline to Commit</Label>
        <Controller
          name="timeline"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {TIMELINE_OPTIONS.map((option) => (
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
      </div>

      {/* Investment Goals */}
      <div>
        <Label>Investment Goals (select all that apply)</Label>
        <Controller
          name="investmentGoals"
          control={control}
          render={({ field }) => (
            <div className="mt-2 flex flex-wrap gap-2">
              {INVESTMENT_GOALS.map((goal) => {
                const isSelected = field.value?.includes(goal.value);
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        field.onChange(field.value?.filter((g) => g !== goal.value) || []);
                      } else {
                        field.onChange([...(field.value || []), goal.value]);
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-primary/50'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {goal.label}
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Likelihood */}
      <div>
        <Label>How likely are you to invest?</Label>
        <Controller
          name="likelihood"
          control={control}
          render={({ field }) => (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {LIKELIHOOD_OPTIONS.map((option) => (
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
      </div>

      {/* Questions for Manager */}
      <div>
        <Label htmlFor="questionsForManager">Questions for the Fund Manager</Label>
        <textarea
          id="questionsForManager"
          {...register('questionsForManager')}
          placeholder="Any questions or topics you'd like to discuss..."
          rows={4}
          className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
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

