import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PublicFormHeader } from '@/components/layout/PublicFormHeader';
import {
  OnboardingWizard,
  PersonalInfoStep,
  AddressEntityStep,
  TaxAccreditationStep,
  InvestmentConsentStep,
  BankingInfoStep,
  ConfirmKYCStep,
} from '../components';
import { useOnboarding } from '../hooks';
import {
  PersonalInfoData,
  AddressEntityData,
  TaxAccreditationData,
  InvestmentConsentData,
  BankingInfoData,
} from '../types';
import { kycApi } from '@/lib/api/kyc';
import { KYCApplication } from '@/features/kyc/types';

export function OnboardingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const kycId = searchParams.get('kyc');

  // KYC data state
  const [kycData, setKycData] = useState<KYCApplication | null>(null);
  const [kycLoading, setKycLoading] = useState(!!kycId);
  const [kycConfirmed, setKycConfirmed] = useState(false);
  
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
    setKycApplicationId,
  } = useOnboarding(inviteCode || '');

  // Load KYC data if kyc parameter is provided
  useEffect(() => {
    if (kycId) {
      setKycLoading(true);
      setKycApplicationId(kycId); // Store the KYC application ID for submission
      kycApi.getById(kycId)
        .then((data) => {
          setKycData(data);
          // Pre-populate form with KYC data
          const prefillData: Partial<PersonalInfoData & AddressEntityData> = {};
          
          if (data.investorCategory === 'individual') {
            prefillData.firstName = data.firstName || '';
            prefillData.lastName = data.lastName || '';
            prefillData.email = data.email || '';
            prefillData.phone = data.phone || '';
            prefillData.city = data.city || '';
            prefillData.state = data.state || '';
            prefillData.country = data.country || 'United States';
            prefillData.zipCode = data.postalCode || '';
          } else {
            prefillData.firstName = data.authorizedSignerFirstName || '';
            prefillData.lastName = data.authorizedSignerLastName || '';
            prefillData.email = data.workEmail || data.email || '';
            prefillData.phone = data.workPhone || '';
            prefillData.city = data.principalOfficeCity || '';
            prefillData.state = data.principalOfficeState || '';
            prefillData.country = data.principalOfficeCountry || 'United States';
            prefillData.zipCode = data.postalCode || '';
            prefillData.entityName = data.entityLegalName || '';
          }
          
          if (data.preferredContact) {
            prefillData.preferredContact = data.preferredContact as any;
          }
          
          updateFormData(prefillData);
        })
        .catch((err) => {
          console.error('Failed to load KYC data:', err);
        })
        .finally(() => {
          setKycLoading(false);
        });
    }
  }, [kycId, setKycApplicationId]);

  // Redirect to success page after submission
  if (status === 'submitted') {
    navigate('/onboard/success', { replace: true });
    return null;
  }

  const handleKYCConfirm = () => {
    setKycConfirmed(true);
    nextStep();
  };

  const handleKYCEdit = () => {
    setKycConfirmed(true);
    // Go to personal info step to edit
  };

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

  const handleInvestmentConsentNext = (data: InvestmentConsentData) => {
    updateFormData(data);
    nextStep();
  };

  const handleBankingInfoSubmit = async (data: BankingInfoData) => {
    updateFormData(data);
    await submitApplication();
  };

  // Determine total steps and current step offset based on KYC data
  const hasKYCData = !!kycData && !kycConfirmed;
  const totalSteps = 5; // Personal Info, Address, Tax, Investment, Banking

  const renderStep = () => {
    // Show KYC confirmation step if we have KYC data and haven't confirmed yet
    if (hasKYCData) {
      return (
        <ConfirmKYCStep
          kycData={kycData}
          onConfirm={handleKYCConfirm}
          onEdit={handleKYCEdit}
        />
      );
    }

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
            onSubmit={handleInvestmentConsentNext}
            onBack={prevStep}
            isSubmitting={false}
          />
        );
      case 5:
        return (
          <BankingInfoStep
            data={formData}
            onSubmit={handleBankingInfoSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  // Loading state for KYC data
  if (kycLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <PublicFormHeader fundId={kycData?.fundId} />

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Investor Application</h2>
          <p className="mt-2 text-muted-foreground">
            Complete this form to apply for investment in the fund
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          {!hasKYCData && (
            <OnboardingWizard currentStep={currentStep} totalSteps={totalSteps} />
          )}
          
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








