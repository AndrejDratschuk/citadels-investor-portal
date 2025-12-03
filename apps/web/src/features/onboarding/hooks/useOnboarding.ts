import { useState, useCallback } from 'react';
import { OnboardingFormData, OnboardingStatus } from '../types';

interface UseOnboardingReturn {
  currentStep: number;
  formData: Partial<OnboardingFormData>;
  status: OnboardingStatus;
  isSubmitting: boolean;
  error: string | null;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  submitApplication: () => Promise<void>;
  resetForm: () => void;
}

const TOTAL_STEPS = 4;

const initialFormData: Partial<OnboardingFormData> = {
  preferredContact: 'email',
  entityType: 'individual',
  taxIdType: 'ssn',
  accreditationType: 'income',
  country: 'United States',
  taxResidency: 'United States',
  consent: false,
};

export function useOnboarding(inviteCode: string): UseOnboardingReturn {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>(initialFormData);
  const [status, setStatus] = useState<OnboardingStatus>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const submitApplication = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/onboarding/submit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ inviteCode, data: formData }),
      // });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success
      console.log('Submitting onboarding application:', { inviteCode, formData });
      
      setStatus('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteCode, formData]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setStatus('draft');
    setError(null);
  }, []);

  return {
    currentStep,
    formData,
    status,
    isSubmitting,
    error,
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    submitApplication,
    resetForm,
  };
}






