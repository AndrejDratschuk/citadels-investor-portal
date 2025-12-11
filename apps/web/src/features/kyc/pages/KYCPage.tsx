import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PublicFormHeader } from '@/components/layout/PublicFormHeader';
import { useFundBranding } from '@/hooks/useFund';
import {
  KYCWizard,
  InvestorTypeStep,
  IdentityStep,
  AccreditationStep,
  InvestmentIntentStep,
  ConsentStep,
  CalendlyEmbed,
} from '../components';
import { useKYC } from '../hooks';
import {
  InvestorTypeData,
  IndividualIdentityData,
  EntityIdentityData,
  AccreditationData,
  InvestmentIntentData,
  ConsentData,
} from '../types';

// Default Calendly URL - should be configured per fund
const DEFAULT_CALENDLY_URL = 'https://calendly.com/andrejdrats/test';

// Investor type mapping for pre-selected routes
const INVESTOR_TYPE_CONFIG: Record<string, { category: 'individual' | 'entity'; type: string }> = {
  individual: { category: 'individual', type: 'hnw' },
  trust: { category: 'entity', type: 'trust' },
  fund: { category: 'entity', type: 'family_office' },
  entity: { category: 'entity', type: 'corp_llc' },
};

interface KYCPageProps {
  investorType?: 'individual' | 'trust' | 'fund' | 'entity';
}

export function KYCPage({ investorType }: KYCPageProps) {
  const { fundCode } = useParams<{ fundCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationId = searchParams.get('id');

  // If investor type is pre-selected, we skip step 1
  const hasPreselectedType = !!investorType;
  const typeConfig = investorType ? INVESTOR_TYPE_CONFIG[investorType] : null;

  const [showEmailForm, setShowEmailForm] = useState(!applicationId);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Fetch fund branding
  const { data: fundBranding } = useFundBranding(fundCode);

  // Create CSS custom properties for branding colors
  const brandingStyle = useMemo(() => {
    const primaryColor = fundBranding?.branding?.primaryColor || '#4f46e5';
    const secondaryColor = fundBranding?.branding?.secondaryColor || '#7c3aed';
    return {
      '--brand-primary': primaryColor,
      '--brand-secondary': secondaryColor,
    } as React.CSSProperties;
  }, [fundBranding]);

  const {
    currentStep,
    formData,
    isLoading,
    isSaving,
    isSubmitting,
    error,
    eligible,
    startApplication,
    loadApplication,
    updateFormData,
    submitApplication,
    nextStep,
    prevStep,
  } = useKYC();

  // Load existing application if ID is provided
  useEffect(() => {
    if (applicationId) {
      loadApplication(applicationId);
    }
  }, [applicationId, loadApplication]);

  // Handle email submission to start application
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      const app = await startApplication(fundCode || '', email);
      setShowEmailForm(false);
      
      // If we have a pre-selected investor type, set it immediately and skip to step 2
      if (hasPreselectedType && typeConfig && app?.id) {
        await updateFormData({
          investorCategory: typeConfig.category,
          investorType: typeConfig.type,
        });
        nextStep(); // Move to step 2 (Identity)
      }
      
      // Update URL with application ID from the returned app
      // Include the investor type path if present
      if (app?.id) {
        const typePath = investorType ? `/${investorType}` : '';
        navigate(`/kyc/${fundCode}${typePath}?id=${app.id}`, { replace: true });
      }
    } catch (err) {
      // Error is handled in the hook
    }
  };

  // Step handlers
  const handleInvestorTypeNext = async (data: InvestorTypeData) => {
    await updateFormData(data);
    nextStep();
  };

  const handleIdentityNext = async (data: IndividualIdentityData | EntityIdentityData) => {
    await updateFormData(data);
    nextStep();
  };

  const handleAccreditationNext = async (data: AccreditationData) => {
    await updateFormData(data);
    nextStep();
  };

  const handleInvestmentIntentNext = async (data: InvestmentIntentData) => {
    await updateFormData(data);
    nextStep();
  };

  const handleConsentSubmit = async (data: ConsentData) => {
    await updateFormData(data);
    await submitApplication();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: 'var(--brand-primary, #4f46e5)' }} />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not eligible state
  if (eligible === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
        <PublicFormHeader fundId={fundCode} />

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-2xl font-bold">Unable to Verify Accreditation</h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Based on your responses, we're unable to verify your accreditation status at this time.
              SEC regulations require investors in private placements to be accredited investors.
            </p>
            <div className="mt-8 p-4 rounded-lg bg-gray-50 text-left">
              <h3 className="font-semibold mb-2">What does this mean?</h3>
              <p className="text-sm text-muted-foreground">
                Accredited investor requirements are set by the SEC. You may qualify if you meet
                income thresholds ($200k+ individual / $300k+ joint), have a net worth over $1M
                (excluding primary residence), or hold certain professional certifications.
              </p>
            </div>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Start Over
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Pre-qualified - show Calendly
  if (eligible === true) {
    const prefillName = formData.investorCategory === 'entity'
      ? `${formData.authorizedSignerFirstName} ${formData.authorizedSignerLastName}`
      : `${formData.firstName} ${formData.lastName}`;
    
    const prefillEmail = formData.investorCategory === 'entity'
      ? formData.workEmail
      : formData.email;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
        <PublicFormHeader fundId={fundCode} />

        <main className="mx-auto max-w-4xl px-4 py-8 pb-16">
          <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
            <CalendlyEmbed
              calendlyUrl={DEFAULT_CALENDLY_URL}
              prefillName={prefillName}
              prefillEmail={prefillEmail}
            />
          </div>
        </main>
      </div>
    );
  }

  // Email entry form
  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
        <PublicFormHeader fundId={fundCode} />

        <main className="mx-auto max-w-lg px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold">Investor Pre-Qualification</h2>
            <p className="mt-2 text-muted-foreground">
              Enter your email to begin the quick pre-qualification process (2-4 minutes)
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5"
                  autoFocus
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Calculate display step and total steps based on whether type is pre-selected
  const totalSteps = hasPreselectedType ? 4 : 5;
  const displayStep = hasPreselectedType ? currentStep - 1 : currentStep;

  // Main KYC form
  const renderStep = () => {
    // If type is pre-selected, we effectively skip step 1
    // So step 2 becomes the first step shown, etc.
    switch (currentStep) {
      case 1:
        // Only show investor type step if type is not pre-selected
        if (hasPreselectedType) {
          // This shouldn't happen as we navigate directly to step 2
          return null;
        }
        return (
          <InvestorTypeStep
            data={formData}
            onNext={handleInvestorTypeNext}
          />
        );
      case 2:
        return (
          <IdentityStep
            data={formData}
            investorCategory={typeConfig?.category || formData.investorCategory || 'individual'}
            onNext={handleIdentityNext}
            onBack={hasPreselectedType ? undefined : prevStep}
          />
        );
      case 3:
        return (
          <AccreditationStep
            data={formData}
            onNext={handleAccreditationNext}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <InvestmentIntentStep
            data={formData}
            onNext={handleInvestmentIntentNext}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <ConsentStep
            data={formData}
            onSubmit={handleConsentSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
      {/* Header */}
      <PublicFormHeader fundId={fundCode} showSaving={true} isSaving={isSaving} />

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Investor Pre-Qualification</h2>
          <p className="mt-2 text-muted-foreground">
            Complete this form to verify your accredited investor status
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm sm:p-8">
          <KYCWizard currentStep={displayStep} totalSteps={totalSteps} />

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

