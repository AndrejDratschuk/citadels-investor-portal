import { api } from './client';

export interface FundBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface FundAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Fund {
  id: string;
  name: string;
  legalName: string;
  address: FundAddress;
  branding: FundBranding;
  wireInstructions?: string;
  status: string;
}

export interface UpdateFundProfileInput {
  name?: string;
  legalName?: string;
  address?: FundAddress;
}

export interface FundBrandingPublic {
  name: string;
  branding: FundBranding;
}

export interface EmailCustomizationSettings {
  // Pre-meeting materials (Q3-4)
  preMeetingMaterialsType: 'website' | 'teaser_doc' | null;
  preMeetingMaterialsUrl: string | null;
  // Accreditation education (Q5-6)
  accreditationEducationType: 'standard_video' | 'custom_text';
  accreditationEducationContent: string | null;
  // Post-meeting communication (Q7)
  postMeetingRecapTemplate: string | null;
  // Nurture content (Q8-9)
  consideringSupportMessage: string | null;
  nurtureUpdateTemplates: string[];
  // Investor onboarding (Q10-11)
  documentReviewTimeframe: string | null;
  welcomeMessage: string | null;
  // Transfer & exit messaging (Q12-15)
  transferProcessNote: string | null;
  transferNextSteps: string | null;
  transferDenialOptions: string | null;
  exitClosingMessage: string | null;
  // Team credentials (Q16)
  userCredentials: string | null;
}

export interface UpdateEmailCustomizationInput {
  preMeetingMaterialsType?: 'website' | 'teaser_doc' | null;
  preMeetingMaterialsUrl?: string | null;
  accreditationEducationType?: 'standard_video' | 'custom_text';
  accreditationEducationContent?: string | null;
  postMeetingRecapTemplate?: string | null;
  consideringSupportMessage?: string | null;
  nurtureUpdateTemplates?: string[];
  documentReviewTimeframe?: string | null;
  welcomeMessage?: string | null;
  transferProcessNote?: string | null;
  transferNextSteps?: string | null;
  transferDenialOptions?: string | null;
  exitClosingMessage?: string | null;
  userCredentials?: string | null;
}

export const fundsApi = {
  // Get current fund (for authenticated managers)
  getCurrent: async (): Promise<Fund> => {
    return api.get<Fund>('/funds/current');
  },

  // Get fund branding (public - for forms)
  getBranding: async (fundId: string): Promise<FundBrandingPublic> => {
    return api.get<FundBrandingPublic>(`/funds/branding/${fundId}`);
  },

  // Update fund profile (name, legal name, address)
  updateProfile: async (input: UpdateFundProfileInput): Promise<Fund> => {
    return api.patch<Fund>('/funds/profile', input);
  },

  // Update branding (colors)
  updateBranding: async (branding: Partial<FundBranding>): Promise<Fund> => {
    return api.patch<Fund>('/funds/branding', branding);
  },

  // Upload logo
  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for multipart
    const token = localStorage.getItem('accessToken');
    const { API_URL } = await import('./client');

    const response = await fetch(`${API_URL}/funds/logo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload logo');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete logo
  deleteLogo: async (): Promise<void> => {
    await api.delete('/funds/logo');
  },

  // Get email customization settings
  getEmailCustomization: async (): Promise<EmailCustomizationSettings> => {
    return api.get<EmailCustomizationSettings>('/funds/email-customization');
  },

  // Update email customization settings
  updateEmailCustomization: async (input: UpdateEmailCustomizationInput): Promise<EmailCustomizationSettings> => {
    return api.patch<EmailCustomizationSettings>('/funds/email-customization', input);
  },
};

