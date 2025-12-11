import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KYCWizardProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

const DEFAULT_STEP_LABELS = [
  'Investor Type',
  'Identity',
  'Accreditation',
  'Investment Intent',
  'Consent',
];

const PRESELECTED_TYPE_LABELS = [
  'Identity',
  'Accreditation',
  'Investment Intent',
  'Consent',
];

export function KYCWizard({ currentStep, totalSteps, stepLabels }: KYCWizardProps) {
  // Use provided labels, or select based on total steps
  const labels = stepLabels || (totalSteps === 4 ? PRESELECTED_TYPE_LABELS : DEFAULT_STEP_LABELS);

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="relative flex justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-sm font-medium transition-colors',
                  step < currentStep && 'border-primary bg-primary text-white',
                  step === currentStep && 'border-primary text-primary',
                  step > currentStep && 'border-gray-200 text-gray-400'
                )}
              >
                {step < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium hidden sm:block',
                  step <= currentStep ? 'text-primary' : 'text-gray-400'
                )}
              >
                {labels[step - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

