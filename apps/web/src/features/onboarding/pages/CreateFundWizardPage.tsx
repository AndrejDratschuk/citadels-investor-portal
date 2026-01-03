import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Building2, 
  Loader2, 
  ChevronRight,
  Check,
  Globe,
  User,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fundCreationApi } from '@/lib/api/fundCreation';
import { useAuthStore } from '@/stores/authStore';
import { 
  createFundWizardSchema, 
  FUND_TYPE_OPTIONS, 
  DISPLAY_ROLE_OPTIONS,
  COUNTRY_OPTIONS,
  type FundType,
  type DisplayRole,
  type CreateFundWizardInput,
} from '@altsui/shared';

type Step = 'fund-info' | 'fund-type' | 'your-role' | 'review';

const STEPS: { id: Step; title: string; icon: React.ElementType }[] = [
  { id: 'fund-info', title: 'Fund Details', icon: Building2 },
  { id: 'fund-type', title: 'Fund Type', icon: Briefcase },
  { id: 'your-role', title: 'Your Role', icon: User },
  { id: 'review', title: 'Review', icon: Check },
];

export function CreateFundWizardPage(): JSX.Element {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('fund-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CreateFundWizardInput>({
    resolver: zodResolver(createFundWizardSchema),
    defaultValues: {
      name: '',
      fundType: 'vc',
      displayRole: 'general_partner',
      entityName: '',
      country: 'US',
    },
  });

  const formValues = watch();
  const selectedFundType = watch('fundType');
  const selectedDisplayRole = watch('displayRole');

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const goToNextStep = async (): Promise<void> => {
    // Validate current step fields
    const fieldsToValidate: (keyof CreateFundWizardInput)[] = 
      currentStep === 'fund-info' ? ['name', 'country'] :
      currentStep === 'fund-type' ? ['fundType'] :
      currentStep === 'your-role' ? ['displayRole'] :
      [];

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < STEPS.length) {
      setCurrentStep(STEPS[nextStepIndex].id);
    }
  };

  const goToPrevStep = (): void => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(STEPS[prevStepIndex].id);
    }
  };

  const onSubmit = async (): Promise<void> => {
    // Validate all fields before submission
    const isValid = await trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = formValues as CreateFundWizardInput;
      const result = await fundCreationApi.createFund(data);
      
      // Update user state with completed onboarding
      if (user) {
        setUser({
          ...user,
          fundId: result.fund.id,
          onboardingCompleted: true,
        });
      }

      // Navigate to dashboard
      navigate('/manager');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Set Up Your Fund</h1>
          <p className="mt-2 text-slate-600">
            Welcome, {user?.firstName}! Let's get your fund configured in a few quick steps.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    index < currentStepIndex
                      ? 'bg-primary text-white'
                      : index === currentStepIndex
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step 1: Fund Info */}
            {currentStep === 'fund-info' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Fund Details</h2>
                  <p className="text-slate-600 mt-1">Tell us about your fund</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Fund Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Acme Ventures Fund I"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entityName">Legal Entity Name (optional)</Label>
                    <Input
                      id="entityName"
                      placeholder="e.g., Acme Ventures GP, LLC"
                      {...register('entityName')}
                    />
                    {errors.entityName && (
                      <p className="text-sm text-red-500">{errors.entityName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select
                        id="country"
                        {...register('country')}
                        className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
                      >
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.country && (
                      <p className="text-sm text-red-500">{errors.country.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Fund Type */}
            {currentStep === 'fund-type' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Fund Type</h2>
                  <p className="text-slate-600 mt-1">What type of fund are you managing?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FUND_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedFundType === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={selectedFundType === option.value}
                        onChange={() => setValue('fundType', option.value as FundType)}
                        className="sr-only"
                      />
                      <span className="font-medium text-slate-900">{option.label}</span>
                      <span className="text-sm text-slate-500 mt-1">{option.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Your Role */}
            {currentStep === 'your-role' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Your Role</h2>
                  <p className="text-slate-600 mt-1">How would you describe your role?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DISPLAY_ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDisplayRole === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={selectedDisplayRole === option.value}
                        onChange={() => setValue('displayRole', option.value as DisplayRole)}
                        className="sr-only"
                      />
                      <span className="font-medium text-slate-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Review & Create</h2>
                  <p className="text-slate-600 mt-1">Please verify your fund details</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Fund Name</span>
                    <span className="font-medium text-slate-900">{formValues.name}</span>
                  </div>
                  {formValues.entityName && (
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Legal Entity</span>
                      <span className="font-medium text-slate-900">{formValues.entityName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Country</span>
                    <span className="font-medium text-slate-900">
                      {COUNTRY_OPTIONS.find(c => c.value === formValues.country)?.label || formValues.country}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-600">Fund Type</span>
                    <span className="font-medium text-slate-900">
                      {FUND_TYPE_OPTIONS.find(t => t.value === formValues.fundType)?.label || formValues.fundType}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Your Role</span>
                    <span className="font-medium text-slate-900">
                      {DISPLAY_ROLE_OPTIONS.find(r => r.value === formValues.displayRole)?.label || formValues.displayRole}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-700">
                    You can update these details later in your fund settings. Let's get you started!
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStepIndex > 0 ? (
                <Button type="button" variant="outline" onClick={goToPrevStep}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep !== 'review' ? (
                <Button type="button" onClick={goToNextStep}>
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Fund...
                    </>
                  ) : (
                    <>
                      Create Fund
                      <Check className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

