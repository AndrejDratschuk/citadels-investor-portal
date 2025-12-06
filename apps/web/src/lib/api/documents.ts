import { api } from './client';

export interface Document {
  id: string;
  fundId: string;
  dealId: string | null;
  investorId: string | null;
  type: 'ppm' | 'subscription' | 'k1' | 'report' | 'capital_call' | 'kyc' | 'other';
  name: string;
  filePath: string | null;
  requiresSignature: boolean;
  signingStatus: 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined' | null;
  signedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  dealName?: string | null;
  investorName?: string | null;
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

export interface CreateDocumentInput {
  name: string;
  type: Document['type'];
  dealId?: string;
  investorId?: string;
  filePath?: string;
  requiresSignature?: boolean;
}

export const documentsApi = {
  // Get all documents
  getAll: async (type?: string): Promise<Document[]> => {
    const params = type && type !== 'all' ? `?type=${type}` : '';
    return api.get<Document[]>(`/documents${params}`);
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
    const API_URL = import.meta.env.PROD
      ? 'https://citadel-investor-portal-production.up.railway.app/api'
      : (import.meta.env.VITE_API_URL || '/api');

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
};

export const typeLabels: Record<string, string> = {
  ppm: 'PPM',
  subscription: 'Subscription',
  k1: 'K-1',
  report: 'Report',
  capital_call: 'Capital Call',
  kyc: 'KYC',
  other: 'Other',
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

