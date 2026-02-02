/**
 * Email Templates API Client
 * Handles template listing, customization, and preview
 */

import { api } from './client';

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory = 
  | 'prospect'
  | 'investor_onboarding'
  | 'capital_calls'
  | 'reporting'
  | 'compliance'
  | 'exit_transfer'
  | 'team'
  | 'internal';

export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example?: string;
}

export interface TemplateListItem {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  categoryLabel: string;
  isCustomized: boolean;
  isActive: boolean;
}

export interface CategoryInfo {
  key: TemplateCategory;
  label: string;
  count: number;
}

export interface TemplateListResponse {
  templates: TemplateListItem[];
  categories: CategoryInfo[];
}

export interface TemplateResponse {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  categoryLabel: string;
  variables: TemplateVariable[];
  subject: string;
  body: string;
  isCustomized: boolean;
  isActive: boolean;
}

export interface TemplatePreviewResponse {
  subject: string;
  body: string;
  html: string;
}

export interface SaveTemplateInput {
  subject: string;
  body: string;
}

// ============================================================================
// API Methods
// ============================================================================

export const emailTemplatesApi = {
  /**
   * List all templates with customization status
   */
  listTemplates: async (): Promise<TemplateListResponse> => {
    return api.get<TemplateListResponse>('/email/templates');
  },

  /**
   * Get a single template with full content
   */
  getTemplate: async (key: string): Promise<TemplateResponse> => {
    return api.get<TemplateResponse>(`/email/templates/${key}`);
  },

  /**
   * Save a custom template
   */
  saveTemplate: async (key: string, input: SaveTemplateInput): Promise<TemplateResponse> => {
    return api.put<TemplateResponse>(`/email/templates/${key}`, input);
  },

  /**
   * Reset a template to default
   */
  resetTemplate: async (key: string): Promise<TemplateResponse> => {
    return api.delete<TemplateResponse>(`/email/templates/${key}`);
  },

  /**
   * Preview a template with sample data
   */
  previewTemplate: async (
    key: string,
    subject?: string,
    body?: string
  ): Promise<TemplatePreviewResponse> => {
    return api.post<TemplatePreviewResponse>(`/email/templates/${key}/preview`, {
      subject,
      body,
    });
  },

  /**
   * Toggle template active status
   */
  setTemplateActive: async (key: string, isActive: boolean): Promise<TemplateResponse> => {
    return api.patch<TemplateResponse>(`/email/templates/${key}/active`, { isActive });
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display-friendly category label
 */
export const categoryLabels: Record<string, string> = {
  prospect: 'Prospect Pipeline',
  investor_onboarding: 'Investor Onboarding',
  capital_calls: 'Capital Calls & Distributions',
  reporting: 'Reporting & Tax',
  compliance: 'Compliance & Re-Verification',
  exit_transfer: 'Exit & Transfer',
  team: 'Team Management',
  internal: 'Internal Notifications',
};

/**
 * Group templates by category
 */
export function groupTemplatesByCategory(
  templates: TemplateListItem[]
): Record<string, TemplateListItem[]> {
  const grouped: Record<string, TemplateListItem[]> = {};
  
  for (const template of templates) {
    const category = template.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(template);
  }
  
  return grouped;
}
