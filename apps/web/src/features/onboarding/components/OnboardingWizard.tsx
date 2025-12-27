import { cn } from '@/lib/utils';
import { Check, User, MapPin, FileText, Upload, DollarSign, Building2 } from 'lucide-react';

interface OnboardingWizardProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, title: 'Personal Info', icon: User },
  { number: 2, title: 'Address', icon: MapPin },
  { number: 3, title: 'Tax & Accreditation', icon: FileText },
  { number: 4, title: 'Documents', icon: Upload },
  { number: 5, title: 'Investment', icon: DollarSign },
  { number: 6, title: 'Banking', icon: Building2 },
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
        {/* Connector line - one continuous line behind all circles */}
        <div 
          className="absolute top-[18px] left-0 right-0 h-0.5 bg-muted-foreground/30"
          style={{ zIndex: 0, marginLeft: '8.33%', marginRight: '8.33%' }}
        />
        {/* Progress line - colored portion */}
        <div 
          className="absolute top-[18px] left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ 
            zIndex: 0, 
            marginLeft: '8.33%',
            width: `${((currentStep - 1) / (steps.length - 1)) * 83.34}%`
          }}
        />

        {/* Step Circles */}
        <div className="relative flex justify-between" style={{ zIndex: 1 }}>
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div key={step.number} className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary bg-white text-primary'
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


























