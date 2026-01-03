import { useState, useCallback } from 'react';
import { OnboardingFormData, OnboardingStatus, PendingDocument } from '../types';
import { onboardingApi } from '@/lib/api/onboarding';
import { documentsApi } from '@/lib/api/documents';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';

interface AccountData {
  email: string;
  password: string;
}

interface UseOnboardingReturn {
  currentStep: number;
  formData: Partial<OnboardingFormData>;
  validationDocuments: PendingDocument[];
  status: OnboardingStatus;
  isSubmitting: boolean;
  isCreatingAccount: boolean;
  error: string | null;
  accountError: string | null;
  kycApplicationId: string | null;
  accountCreated: boolean;
  userId: string | null;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  updateValidationDocuments: (docs: PendingDocument[]) => void;
  setKycApplicationId: (id: string | null) => void;
  createAccount: (data: AccountData) => Promise<void>;
  submitApplication: (finalData?: Partial<OnboardingFormData>) => Promise<void>;
  resetForm: () => void;
}

// Updated to 7 steps: Account, Personal, Address, Tax, Documents, Investment, Banking
const TOTAL_STEPS = 7;

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
  const [validationDocuments, setValidationDocuments] = useState<PendingDocument[]>([]);
  const [status, setStatus] = useState<OnboardingStatus>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [kycApplicationId, setKycApplicationId] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPassword, setUserPassword] = useState<string | null>(null);

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

  const updateValidationDocuments = useCallback((docs: PendingDocument[]) => {
    setValidationDocuments(docs);
    setError(null);
  }, []);

  const createAccount = useCallback(async (data: AccountData) => {
    setIsCreatingAccount(true);
    setAccountError(null);

    try {
      // Create account via API (uses backend Supabase admin client)
      const result = await authApi.createOnboardingAccount(data.email, data.password);

      // Store user ID and password for later use during submission
      setUserId(result.userId);
      setUserPassword(data.password);
      setAccountCreated(true);
      
      // Store auth tokens so user is logged in
      const { setAuth } = useAuthStore.getState();
      setAuth(
        { 
          id: result.userId, 
          email: result.email, 
          role: 'investor', 
          fundId: null, 
          firstName: null,
          lastName: null,
          onboardingCompleted: false,
          createdAt: new Date().toISOString() 
        },
        result.accessToken,
        result.refreshToken
      );
      
      // Update form data with email
      setFormData((prev) => ({ ...prev, email: data.email }));
      
      // Move to next step
      setCurrentStep((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setAccountError(message);
      throw err;
    } finally {
      setIsCreatingAccount(false);
    }
  }, []);

  const submitApplication = useCallback(async (finalData?: Partial<OnboardingFormData>) => {
    setIsSubmitting(true);
    setError(null);

    // Merge final data with existing form data
    const submissionData = finalData ? { ...formData, ...finalData } : formData;

    try {
      // First submit the application to get investor ID
      // Pass the password for existing account linking
      const result = await onboardingApi.submit(
        inviteCode,
        submissionData,
        userPassword || undefined,
        kycApplicationId || undefined,
        userId || undefined
      );
      
      // If we have validation documents and an investor ID, upload them
      const validDocs = validationDocuments.filter(doc => !doc.error);
      if (validDocs.length > 0 && result?.investorId) {
        for (const doc of validDocs) {
          try {
            // Upload the file
            const { fileUrl } = await documentsApi.uploadFile(doc.file);
            
            // Create the document record
            await documentsApi.create({
              name: doc.customName || doc.file.name,
              type: 'kyc', // Use kyc type for validation documents
              category: 'investor',
              investorId: result.investorId,
              filePath: fileUrl,
              // Additional metadata for validation documents
              subcategory: 'validation',
              validationStatus: 'pending',
              uploadedBy: 'investor',
              documentType: doc.documentType,
              fileSize: doc.file.size,
              mimeType: doc.file.type,
            });
          } catch (uploadErr) {
            console.error('Failed to upload document:', doc.file.name, uploadErr);
            // Continue with other documents even if one fails
          }
        }
      }
      
      setStatus('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [inviteCode, formData, validationDocuments, kycApplicationId, userId, userPassword]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setValidationDocuments([]);
    setStatus('draft');
    setError(null);
    setAccountError(null);
    setKycApplicationId(null);
    setAccountCreated(false);
    setUserId(null);
    setUserPassword(null);
  }, []);

  return {
    currentStep,
    formData,
    validationDocuments,
    status,
    isSubmitting,
    isCreatingAccount,
    error,
    accountError,
    kycApplicationId,
    accountCreated,
    userId,
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    updateValidationDocuments,
    setKycApplicationId,
    createAccount,
    submitApplication,
    resetForm,
  };
}








