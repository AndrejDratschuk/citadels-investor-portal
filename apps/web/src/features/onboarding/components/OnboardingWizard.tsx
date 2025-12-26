import { cn } from '@/lib/utils';
import { Check, User, MapPin, FileText, DollarSign, Building2 } from 'lucide-react';

interface OnboardingWizardProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, title: 'Personal Info', icon: User },
  { number: 2, title: 'Address', icon: MapPin },
  { number: 3, title: 'Tax & Accreditation', icon: FileText },
  { number: 4, title: 'Investment', icon: DollarSign },
  { number: 5, title: 'Banking', icon: Building2 },
];

export function OnboardingWizard({ currentStep, totalSteps }: OnboardingWizardProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="hidden sm:block relative">
        {/* Connector Lines - positioned behind circles */}
        <div className="absolute top-[18px] left-0 right-0 flex">
          {steps.slice(0, -1).map((step, index) => (
            <div
              key={`line-${index}`}
              className={cn(
                'h-0.5 flex-1',
                currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
              style={{ 
                marginLeft: index === 0 ? 'calc(10% - 4px)' : '0',
                marginRight: index === steps.length - 2 ? 'calc(10% - 4px)' : '0',
              }}
            />
          ))}
        </div>

        {/* Step Circles */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all bg-white',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px]',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                currentStep === step.number
                  ? 'w-6 bg-primary'
                  : currentStep > step.number
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-sm font-medium">
          {steps.find((s) => s.number === currentStep)?.title}
        </p>
      </div>
    </div>
  );
}


























