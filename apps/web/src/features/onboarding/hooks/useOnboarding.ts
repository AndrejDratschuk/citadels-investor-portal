import { useState, useCallback } from 'react';
import { OnboardingFormData, OnboardingStatus } from '../types';
import { onboardingApi } from '@/lib/api/onboarding';

interface UseOnboardingReturn {
  currentStep: number;
  formData: Partial<OnboardingFormData>;
  status: OnboardingStatus;
  isSubmitting: boolean;
  error: string | null;
  kycApplicationId: string | null;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  setKycApplicationId: (id: string | null) => void;
  submitApplication: (password?: string) => Promise<void>;
  resetForm: () => void;
}

const TOTAL_STEPS = 5;

const initialFormData: Partial<OnboardingFormData> = {
  preferredContact: 'email',
  entityType: 'individual',
  taxIdType: 'ssn',
  accreditationType: 'income',
  country: 'United States',
  taxResidency: 'United States',
  consent: false,
  // Banking defaults
  distributionMethod: 'wire',
  accountType: 'checking',
};

export function useOnboarding(inviteCode: string): UseOnboardingReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>(initialFormData);
  const [status, setStatus] = useState<OnboardingStatus>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycApplicationId, setKycApplicationId] = useState<string | null>(null);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const updateFormData = useCallback((data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setError(null);
  }, []);

  const submitApplication = useCallback(async (password?: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onboardingApi.submit(
        inviteCode,
        formData,
        password,
        kycApplicationId || undefined
      );
      
      setStatus('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteCode, formData, kycApplicationId]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setStatus('draft');
    setError(null);
    setKycApplicationId(null);
  }, []);

  return {
    currentStep,
    formData,
    status,
    isSubmitting,
    error,
    kycApplicationId,
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    setKycApplicationId,
    submitApplication,
    resetForm,
  };
}








