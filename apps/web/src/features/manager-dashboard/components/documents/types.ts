import {
  Document,
  DocumentsByDeal,
  DocumentsByInvestor,
  DocumentCategory,
  DocumentDepartment,
  DocumentStatus,
  ValidationStatus,
} from '@/lib/api/documents';

export type TabType = 'all' | 'fund' | 'by-deal' | 'by-investor' | 'validation';
export type ViewMode = 'list' | 'detail';

export interface ValidationDocument extends Document {
  validationStatus?: ValidationStatus;
}

export interface DocumentFiltersState {
  typeFilter: string;
  dealFilter: string | null;
  investorFilter: string | null;
  departmentFilter: string | null;
  statusFilter: string | null;
  searchQuery: string;
}

export interface DealOption {
  id: string;
  name: string;
}

export interface InvestorOption {
  id: string;
  firstName: string;
  lastName: string;
}

export const signingStatusStyles: Record<string, { bg: string; text: string }> = {
  not_sent: { bg: 'bg-gray-100', text: 'text-gray-700' },
  sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  signed: { bg: 'bg-green-100', text: 'text-green-700' },
  declined: { bg: 'bg-red-100', text: 'text-red-700' },
};

export type {
  Document,
  DocumentsByDeal,
  DocumentsByInvestor,
  DocumentCategory,
  DocumentDepartment,
  DocumentStatus,
  ValidationStatus,
};

