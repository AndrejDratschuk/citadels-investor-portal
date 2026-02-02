import { api } from './client';

export type DocumentCategory = 'fund' | 'deal' | 'investor';
export type DocumentDepartment = 'tax' | 'finance' | 'marketing' | 'strategy' | 'operations' | 'legal' | 'compliance';
export type DocumentStatus = 'draft' | 'review' | 'final';

export interface Document {
  id: string;
  fundId: string;
  dealId: string | null;
  investorId: string | null;
  type: 'ppm' | 'subscription' | 'k1' | 'report' | 'capital_call' | 'kyc' | 'tax_filing' | 'proof_of_identity' | 'net_worth_statement' | 'other';
  name: string;
  filePath: string | null;
  requiresSignature: boolean;
  signingStatus: 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined' | null;
  signedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  dealName?: string | null;
  investorName?: string | null;
  // New fields
  category?: DocumentCategory;
  department?: DocumentDepartment | null;
  status?: DocumentStatus;
  tags?: string[];
  // Validation document fields
  subcategory?: string | null;
  uploadedBy?: 'investor' | 'fund_manager' | 'docusign_auto' | 'system';
  validatedBy?: string | null;
  validatedAt?: string | null;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
}

export interface DocumentsByDeal {
  dealId: string;
  dealName: string;
  dealStatus: string;
  closeDate: string | null;
  totalEquity: number;
  investorCount: number;
  documentCount: number;
}

export interface DocumentsByInvestor {
  investorId: string;
  investorName: string;
  email: string;
  documentCount: number;
}

export type ValidationStatus = 'pending' | 'approved' | 'rejected';

export interface CreateDocumentInput {
  name: string;
  type: Document['type'];
  category?: DocumentCategory;
  department?: DocumentDepartment;
  status?: DocumentStatus;
  tags?: string[];
  dealId?: string;
  investorId?: string;
  filePath?: string;
  requiresSignature?: boolean;
  // Validation document fields
  subcategory?: string;
  validationStatus?: ValidationStatus;
  uploadedBy?: 'investor' | 'fund_manager' | 'docusign_auto' | 'system';
  documentType?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface DocumentFilters {
  type?: string;
  category?: DocumentCategory;
  department?: DocumentDepartment;
  status?: DocumentStatus;
  dealId?: string;
  investorId?: string;
  tag?: string;
}

export const documentsApi = {
  // Get all documents with filters
  getAll: async (filters?: DocumentFilters | string): Promise<Document[]> => {
    // Support legacy string (type) or new filter object
    if (typeof filters === 'string') {
      const params = filters && filters !== 'all' ? `?type=${filters}` : '';
      return api.get<Document[]>(`/documents${params}`);
    }
    
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dealId) params.append('dealId', filters.dealId);
    if (filters?.investorId) params.append('investorId', filters.investorId);
    if (filters?.tag) params.append('tag', filters.tag);
    
    const queryString = params.toString();
    return api.get<Document[]>(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // Get fund-level documents only
  getFundDocuments: async (): Promise<Document[]> => {
    return api.get<Document[]>('/documents?category=fund');
  },

  // Get documents grouped by deal
  getByDeal: async (): Promise<DocumentsByDeal[]> => {
    return api.get<DocumentsByDeal[]>('/documents/by-deal');
  },

  // Get documents grouped by investor
  getByInvestor: async (): Promise<DocumentsByInvestor[]> => {
    return api.get<DocumentsByInvestor[]>('/documents/by-investor');
  },

  // Get documents for a specific deal
  getDocumentsForDeal: async (dealId: string): Promise<Document[]> => {
    return api.get<Document[]>(`/documents/deal/${dealId}`);
  },

  // Get documents for a specific investor
  getDocumentsForInvestor: async (investorId: string): Promise<Document[]> => {
    return api.get<Document[]>(`/documents/investor/${investorId}`);
  },

  // Create a document
  create: async (input: CreateDocumentInput): Promise<Document> => {
    return api.post<Document>('/documents', input);
  },

  // Upload file
  uploadFile: async (file: File): Promise<{ fileUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const { API_URL } = await import('./client');

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    const data = await response.json();
    return data.data;
  },

  // Delete a document
  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  // Get all validation documents (pending validation investor documents)
  getValidationDocuments: async (): Promise<Document[]> => {
    return api.get<Document[]>('/documents/validation');
  },

  // Approve a validation document
  approveValidationDocument: async (documentId: string): Promise<Document> => {
    return api.post<Document>(`/documents/${documentId}/approve`, {});
  },

  // Reject a validation document
  rejectValidationDocument: async (documentId: string, reason: string): Promise<Document> => {
    return api.post<Document>(`/documents/${documentId}/reject`, { reason });
  },

  // Get investor's own validation documents (for logged in investor)
  getMyValidationDocuments: async (): Promise<Document[]> => {
    return api.get<Document[]>('/documents/my-validation');
  },
};

export const typeLabels: Record<string, string> = {
  ppm: 'PPM',
  subscription: 'Subscription',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC',
  tax_filing: 'Tax Filing',
  proof_of_identity: 'Proof of Identity',
  net_worth_statement: 'Net Worth Statement',
  other: 'Other',
};

export const validationStatusLabels: Record<string, string> = {
  pending: 'Pending Validation',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const validationStatusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const categoryLabels: Record<DocumentCategory, string> = {
  fund: 'Fund',
  deal: 'Deal',
  investor: 'Investor',
};

export const departmentLabels: Record<DocumentDepartment, string> = {
  tax: 'Tax',
  finance: 'Finance',
  marketing: 'Marketing',
  strategy: 'Strategy',
  operations: 'Operations',
  legal: 'Legal',
  compliance: 'Compliance',
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Draft',
  review: 'Under Review',
  final: 'Final',
};

export const statusLabels: Record<string, string> = {
  prospective: 'Prospective',
  under_contract: 'Under Contract',
  acquired: 'Acquired',
  renovating: 'Renovating',
  stabilized: 'Stabilized',
  for_sale: 'For Sale',
  sold: 'Sold',
};





