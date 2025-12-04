import { useParams, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import {
  OnboardingWizard,
  PersonalInfoStep,
  AddressEntityStep,
  TaxAccreditationStep,
  InvestmentConsentStep,
} from '../components';
import { useOnboarding } from '../hooks';
import {
  PersonalInfoData,
  AddressEntityData,
  TaxAccreditationData,
  InvestmentConsentData,
} from '../types';

export function OnboardingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  
  const {
    currentStep,
    formData,
    status,
    isSubmitting,
    error,
    nextStep,
    prevStep,
    updateFormData,
    submitApplication,
  } = useOnboarding(inviteCode || '');

  // Redirect to success page after submission
  if (status === 'submitted') {
    navigate('/onboard/success', { replace: true });
    return null;
  }

  const handlePersonalInfoNext = (data: PersonalInfoData) => {
    updateFormData(data);
    nextStep();
  };

  const handleAddressEntityNext = (data: AddressEntityData) => {
    updateFormData(data);
    nextStep();
  };

  const handleTaxAccreditationNext = (data: TaxAccreditationData) => {
    updateFormData(data);
    nextStep();
  };

  const handleInvestmentConsentSubmit = async (data: InvestmentConsentData) => {
    updateFormData(data);
    await submitApplication();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            data={formData}
            onNext={handlePersonalInfoNext}
          />
        );
      case 2:
        return (
          <AddressEntityStep
            data={formData}
            onNext={handleAddressEntityNext}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <TaxAccreditationStep
            data={formData}
            onNext={handleTaxAccreditationNext}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <InvestmentConsentStep
            data={formData}
            onSubmit={handleInvestmentConsentSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">FlowVeda</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Secure Form
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Investor Application</h2>
          <p className="mt-2 text-muted-foreground">
            Complete this form to apply for investment in the fund
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <OnboardingWizard currentStep={currentStep} totalSteps={4} />
          
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {renderStep()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:support@flowveda.com" className="text-primary hover:underline">
              support@flowveda.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}








