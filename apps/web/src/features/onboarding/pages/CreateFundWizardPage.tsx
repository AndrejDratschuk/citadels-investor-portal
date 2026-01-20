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
  Upload,
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
import { useDataImportOnboarding } from '../hooks';
import {
  WelcomeRoadmapModal,
  DataSourceSelector,
  FileUploadStep,
  ColumnMappingStep,
  ImportSuccessModal,
  AIDashboardPrompt,
} from '../components/data-import';

type FundStep = 'fund-info' | 'fund-type' | 'your-role' | 'review';
type Phase = 'fund-creation' | 'data-import';

const FUND_STEPS: { id: FundStep; title: string; icon: React.ElementType }[] = [
  { id: 'fund-info', title: 'Fund Details', icon: Building2 },
  { id: 'fund-type', title: 'Fund Type', icon: Briefcase },
  { id: 'your-role', title: 'Your Role', icon: User },
  { id: 'review', title: 'Review', icon: Check },
];

export function CreateFundWizardPage(): JSX.Element {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [phase, setPhase] = useState<Phase>('fund-creation');
  const [currentFundStep, setCurrentFundStep] = useState<FundStep>('fund-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFund, setCreatedFund] = useState<{ id: string; name: string } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);

  // Data import state
  const dataImport = useDataImportOnboarding(createdFund?.name);

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

  const currentFundStepIndex = FUND_STEPS.findIndex(s => s.id === currentFundStep);

  const goToNextFundStep = async (): Promise<void> => {
    const fieldsToValidate: (keyof CreateFundWizardInput)[] = 
      currentFundStep === 'fund-info' ? ['name', 'country'] :
      currentFundStep === 'fund-type' ? ['fundType'] :
      currentFundStep === 'your-role' ? ['displayRole'] :
      [];

    if (fieldsToValidate.length > 0) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    const nextStepIndex = currentFundStepIndex + 1;
    if (nextStepIndex < FUND_STEPS.length) {
      setCurrentFundStep(FUND_STEPS[nextStepIndex].id);
    }
  };

  const goToPrevFundStep = (): void => {
    const prevStepIndex = currentFundStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentFundStep(FUND_STEPS[prevStepIndex].id);
    }
  };

  const onSubmitFund = async (): Promise<void> => {
    const isValid = await trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data = formValues as CreateFundWizardInput;
      const result = await fundCreationApi.createFund(data);
      
      // Store created fund info
      setCreatedFund({ id: result.fund.id, name: result.fund.name });

      // Update user state with fundId but DO NOT mark onboarding complete yet
      // Onboarding is only complete after data import phase (or skip)
      if (user) {
        setUser({
          ...user,
          fundId: result.fund.id,
          // onboardingCompleted stays false until data import is done/skipped
        });
      }

      // Move to data import phase
      setPhase('data-import');
      setShowWelcomeModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWelcomeGetStarted = (): void => {
    setShowWelcomeModal(false);
    dataImport.goToStep('source-selection');
  };

  const handleSkipDataImport = (): void => {
    setShowWelcomeModal(false);
    // Now mark onboarding as complete since user is skipping data import
    if (user) {
      setUser({
        ...user,
        onboardingCompleted: true,
      });
    }
    navigate('/manager');
  };

  const handleSourceContinue = (): void => {
    if (dataImport.state.selectedSource === 'sample') {
      dataImport.handleUseSampleData();
    } else {
      dataImport.goToStep('file-upload');
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!createdFund) {
      setError('Fund not found');
      return;
    }
    await dataImport.executeImport(createdFund.id);
    if (dataImport.state.importResult?.success) {
      setShowSuccessModal(true);
    }
  };

  const handleSuccessClose = (): void => {
    setShowSuccessModal(false);
    // Check if we should show AI dashboard prompt
    const dismissed = localStorage.getItem('ai_dashboard_prompt_dismissed');
    if (!dismissed) {
      setShowAIPrompt(true);
    } else {
      // Mark onboarding as complete and navigate
      if (user) {
        setUser({
          ...user,
          onboardingCompleted: true,
        });
      }
      navigate('/manager');
    }
  };

  const handleAIDone = (): void => {
    setShowAIPrompt(false);
    // Mark onboarding as complete after data import flow
    if (user) {
      setUser({
        ...user,
        onboardingCompleted: true,
      });
    }
    navigate('/manager');
  };

  // Render Fund Creation Phase
  if (phase === 'fund-creation') {
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
              Welcome{user?.firstName ? `, ${user.firstName}` : ''}! Let's get your fund configured in a few quick steps.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2">
              {FUND_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      index < currentFundStepIndex
                        ? 'bg-primary text-white'
                        : index === currentFundStepIndex
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {index < currentFundStepIndex ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < FUND_STEPS.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-2 rounded ${
                        index < currentFundStepIndex ? 'bg-primary' : 'bg-slate-200'
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
              {currentFundStep === 'fund-info' && (
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
              {currentFundStep === 'fund-type' && (
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
              {currentFundStep === 'your-role' && (
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
              {currentFundStep === 'review' && (
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

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      After creating your fund, you'll be guided to import your financial data to get started with dashboards and analytics.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentFundStepIndex > 0 ? (
                  <Button type="button" variant="outline" onClick={goToPrevFundStep}>
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentFundStep !== 'review' ? (
                  <Button type="button" onClick={goToNextFundStep}>
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={onSubmitFund} disabled={isSubmitting}>
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

  // Render Data Import Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Import Your Data</h1>
          <p className="mt-2 text-slate-600">
            {createdFund?.name ? `Let's add data to ${createdFund.name}` : 'Import financial data to power your dashboard'}
          </p>
        </div>

        {/* Error Message */}
        {(error || dataImport.state.error) && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error || dataImport.state.error}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Loading State */}
          {dataImport.state.isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-slate-600">Loading data...</p>
            </div>
          )}

          {/* Content steps - only when not loading */}
          {!dataImport.state.isLoading && (
            <>
              {/* Source Selection Step */}
              {dataImport.state.currentStep === 'source-selection' && (
                <DataSourceSelector
                  selectedSource={dataImport.state.selectedSource}
                  onSelectSource={dataImport.selectSource}
                  onContinue={handleSourceContinue}
                />
              )}

              {/* File Upload Step */}
              {dataImport.state.currentStep === 'file-upload' && (
                <FileUploadStep
                  connectionName={dataImport.state.connectionName}
                  onConnectionNameChange={dataImport.setConnectionName}
                  onFileSelect={dataImport.handleFileSelect}
                  onUseSampleData={dataImport.handleUseSampleData}
                  onBack={dataImport.goBack}
                  isLoading={dataImport.state.isLoading}
                  error={dataImport.state.error}
                  selectedFile={dataImport.state.selectedFile}
                  showDealSelector={false}
                />
              )}

              {/* Column Mapping Step */}
              {dataImport.state.currentStep === 'column-mapping' && dataImport.state.parsedFile && (
                <ColumnMappingStep
                  parsedData={dataImport.state.parsedFile}
                  suggestions={dataImport.state.suggestedMappings}
                  kpiDefinitions={dataImport.state.kpiDefinitions}
                  onMappingsChange={dataImport.updateMappings}
                  onContinue={handleImport}
                  onBack={dataImport.goBack}
                  isLoading={dataImport.state.isLoading}
                  error={dataImport.state.error}
                  isSampleData={dataImport.state.useSampleData}
                />
              )}

              {/* Error Fallback for column-mapping without parsedFile */}
              {dataImport.state.currentStep === 'column-mapping' && !dataImport.state.parsedFile && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load Data</h3>
                  <p className="text-slate-600 mb-6">
                    There was a problem loading your data. Please try again.
                  </p>
                  <Button variant="outline" onClick={() => dataImport.goToStep('source-selection')}>
                    Go Back
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <WelcomeRoadmapModal
        fundName={createdFund?.name}
        onGetStarted={handleWelcomeGetStarted}
        onSkip={handleSkipDataImport}
        isOpen={showWelcomeModal}
      />

      {dataImport.state.importResult && (
        <ImportSuccessModal
          result={dataImport.state.importResult}
          connectionName={dataImport.state.connectionName}
          onClose={handleSuccessClose}
          isOpen={showSuccessModal}
        />
      )}

      <AIDashboardPrompt
        onGenerate={handleAIDone}
        onSkip={handleAIDone}
        isOpen={showAIPrompt}
      />
    </div>
  );
}
