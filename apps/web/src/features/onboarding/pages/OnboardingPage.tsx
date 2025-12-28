import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PublicFormHeader } from '@/components/layout/PublicFormHeader';
import {
  OnboardingWizard,
  AccountCreationStep,
  PersonalInfoStep,
  AddressEntityStep,
  TaxAccreditationStep,
  ValidationDocumentsStep,
  InvestmentConsentStep,
  BankingInfoStep,
  ConfirmKYCStep,
  OnboardingConfirmation,
} from '../components';
import { useOnboarding } from '../hooks';
import type { AccountCreationData } from '../components/AccountCreationStep';
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
  const kycId = searchParams.get('kyc');

  // KYC data state
  const [kycData, setKycData] = useState<KYCApplication | null>(null);
  const [kycLoading, setKycLoading] = useState(!!kycId);
  const [kycConfirmed, setKycConfirmed] = useState(false);
  
  const {
    currentStep,
    formData,
    validationDocuments,
    status,
    isSubmitting,
    isCreatingAccount,
    error,
    accountError,
    nextStep,
    prevStep,
    updateFormData,
    updateValidationDocuments,
    createAccount,
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

  // Show confirmation page after submission
  const showConfirmation = status === 'submitted';

  const handleAccountCreation = async (data: AccountCreationData) => {
    await createAccount({ email: data.email, password: data.password });
  };

  const handleKYCConfirm = () => {
    setKycConfirmed(true);
    // Don't call nextStep() - user still needs to create account (step 1)
  };

  const handleKYCEdit = () => {
    setKycConfirmed(true);
    // Skip account creation and go directly to personal info step to edit
    // Note: They'll need to go back to create account first
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

  const handleValidationDocumentsNext = () => {
    // Validate that at least one document is uploaded
    const validDocs = validationDocuments.filter((doc) => !doc.error);
    if (validDocs.length === 0) {
      return; // Don't proceed if no valid documents
    }
    nextStep();
  };

  const handleInvestmentConsentNext = (data: InvestmentConsentData) => {
    updateFormData(data);
    nextStep();
  };

  const handleBankingInfoSubmit = async (data: BankingInfoData) => {
    // Pass banking data directly to avoid race condition with state update
    await submitApplication(data);
  };

  // Determine total steps and current step offset based on KYC data
  const hasKYCData = !!kycData && !kycConfirmed;
  const totalSteps = 7; // Account, Personal Info, Address, Tax, Documents, Investment, Banking

  const renderStep = () => {
    // Show confirmation after successful submission
    if (showConfirmation) {
      return (
        <OnboardingConfirmation 
          investorName={formData.firstName ? `${formData.firstName}` : undefined} 
        />
      );
    }

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
          <AccountCreationStep
            prefilledEmail={kycData?.email}
            onNext={handleAccountCreation}
            isLoading={isCreatingAccount}
            error={accountError}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            data={formData}
            onNext={handlePersonalInfoNext}
          />
        );
      case 3:
        return (
          <AddressEntityStep
            data={formData}
            onNext={handleAddressEntityNext}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <TaxAccreditationStep
            data={formData}
            onNext={handleTaxAccreditationNext}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ValidationDocumentsStep
            documents={validationDocuments}
            onDocumentsChange={updateValidationDocuments}
            onNext={handleValidationDocumentsNext}
            onBack={prevStep}
            errors={
              validationDocuments.filter((d) => !d.error).length === 0 && validationDocuments.length > 0
                ? ['Please upload at least one validation document']
                : []
            }
          />
        );
      case 6:
        return (
          <InvestmentConsentStep
            data={formData}
            onSubmit={handleInvestmentConsentNext}
            onBack={prevStep}
            isSubmitting={false}
          />
        );
      case 7:
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
          {!hasKYCData && !showConfirmation && (
            <OnboardingWizard currentStep={currentStep} totalSteps={totalSteps} />
          )}
          
          {error && !showConfirmation && (
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
            <a href="mailto:support@altsui.com" className="text-primary hover:underline">
              support@altsui.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}








