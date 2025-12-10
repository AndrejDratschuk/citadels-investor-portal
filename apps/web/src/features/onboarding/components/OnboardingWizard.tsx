import { cn } from '@/lib/utils';
import { Check, User, MapPin, FileText, DollarSign } from 'lucide-react';

interface OnboardingWizardProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, title: 'Personal Info', icon: User },
  { number: 2, title: 'Address', icon: MapPin },
  { number: 3, title: 'Tax & Accreditation', icon: FileText },
  { number: 4, title: 'Investment', icon: DollarSign },
];

export function OnboardingWizard({ currentStep }: OnboardingWizardProps) {
  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{Math.round((currentStep / steps.length) * 100)}% complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-4 h-0.5 w-16 lg:w-24',
                    currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </div>
          );
        })}
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











