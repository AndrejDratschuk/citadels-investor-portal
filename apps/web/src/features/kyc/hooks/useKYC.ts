import { useState, useCallback } from 'react';
import { kycApi } from '@/lib/api/kyc';
import { KYCApplication, KYCFormData } from '../types';

interface UseKYCReturn {
  application: KYCApplication | null;
  currentStep: number;
  formData: KYCFormData;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;
  eligible: boolean | null;
  startApplication: (fundCode: string, email: string) => Promise<void>;
  loadApplication: (id: string) => Promise<void>;
  updateFormData: (data: Partial<KYCFormData>) => Promise<void>;
  submitApplication: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const TOTAL_STEPS = 5;

export function useKYC(): UseKYCReturn {
  const [application, setApplication] = useState<KYCApplication | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<KYCFormData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);

  // Start a new application
  const startApplication = useCallback(async (fundCode: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const app = await kycApi.start(fundCode, email);
      setApplication(app);
      setFormData({
        email,
        investorCategory: app.investorCategory,
        investorType: app.investorType,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start application');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load an existing application
  const loadApplication = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const app = await kycApi.getById(id);
      setApplication(app);
      setFormData({
        investorCategory: app.investorCategory,
        investorType: app.investorType,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: app.phone,
        country: app.country,
        state: app.state,
        city: app.city,
        postalCode: app.postalCode,
        entityLegalName: app.entityLegalName,
        countryOfFormation: app.countryOfFormation,
        stateOfFormation: app.stateOfFormation,
        authorizedSignerFirstName: app.authorizedSignerFirstName,
        authorizedSignerLastName: app.authorizedSignerLastName,
        authorizedSignerTitle: app.authorizedSignerTitle,
        workEmail: app.workEmail,
        workPhone: app.workPhone,
        principalOfficeCity: app.principalOfficeCity,
        principalOfficeState: app.principalOfficeState,
        principalOfficeCountry: app.principalOfficeCountry,
        accreditationBases: app.accreditationBases,
        indicativeCommitment: app.indicativeCommitment,
        timeline: app.timeline as any,
        investmentGoals: app.investmentGoals,
        likelihood: app.likelihood as any,
        questionsForManager: app.questionsForManager,
        preferredContact: app.preferredContact as any,
        consentGiven: app.consentGiven,
      });
      
      // Set eligible status if already submitted
      if (app.status === 'pre_qualified' || app.status === 'meeting_scheduled' || app.status === 'meeting_complete') {
        setEligible(true);
      } else if (app.status === 'not_eligible') {
        setEligible(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load application');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update form data and autosave
  const updateFormData = useCallback(async (data: Partial<KYCFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    
    if (application?.id) {
      setIsSaving(true);
      try {
        const updated = await kycApi.update(application.id, data);
        setApplication(updated);
      } catch (err: any) {
        console.error('Autosave failed:', err);
        // Don't show error for autosave failures
      } finally {
        setIsSaving(false);
      }
    }
  }, [application?.id]);

  // Submit the application
  const submitApplication = useCallback(async () => {
    if (!application?.id) {
      setError('No application to submit');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await kycApi.submit(application.id);
      setApplication(result.application);
      setEligible(result.eligible);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [application?.id]);

  // Navigation
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, TOTAL_STEPS)));
  }, []);

  return {
    application,
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
    goToStep,
  };
}

