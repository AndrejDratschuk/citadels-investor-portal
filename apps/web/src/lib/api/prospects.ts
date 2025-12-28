/**
 * Prospects API Client
 * API functions for managing pipeline prospects
 */

import { api } from './client';
import type {
  Prospect,
  PipelineMetrics,
  ProspectFilters,
  SendKYCInput,
  UpdateProspectStatusInput,
  ApproveDocumentsInput,
  RejectDocumentsInput,
  ConvertToInvestorInput,
} from '@altsui/shared';

/**
 * Send KYC form to a new prospect
 */
export function sendKYC(input: SendKYCInput): Promise<Prospect> {
  return api.post<Prospect>('/prospects/send-kyc', input);
}

/**
 * Get all prospects with optional filters
 */
export function getProspects(filters?: ProspectFilters): Promise<Prospect[]> {
  const params = new URLSearchParams();
  
  if (filters?.status) {
    const statusArr = Array.isArray(filters.status) ? filters.status : [filters.status];
    params.set('status', statusArr.join(','));
  }
  if (filters?.source) {
    params.set('source', filters.source);
  }
  if (filters?.search) {
    params.set('search', filters.search);
  }
  if (filters?.dateFrom) {
    params.set('dateFrom', filters.dateFrom);
  }
  if (filters?.dateTo) {
    params.set('dateTo', filters.dateTo);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/prospects?${queryString}` : '/prospects';
  
  return api.get<Prospect[]>(endpoint);
}

/**
 * Get pipeline statistics
 */
export function getPipelineStats(): Promise<PipelineMetrics> {
  return api.get<PipelineMetrics>('/prospects/stats');
}

/**
 * Get a single prospect by ID
 */
export function getProspect(id: string): Promise<Prospect> {
  return api.get<Prospect>(`/prospects/${id}`);
}

/**
 * Update prospect status
 */
export function updateProspectStatus(
  id: string,
  input: UpdateProspectStatusInput
): Promise<Prospect> {
  return api.patch<Prospect>(`/prospects/${id}/status`, input);
}

/**
 * Update prospect notes
 */
export function updateProspectNotes(id: string, notes: string): Promise<Prospect> {
  return api.patch<Prospect>(`/prospects/${id}/notes`, { notes });
}

/**
 * Approve prospect documents
 */
export function approveDocuments(
  id: string,
  input: ApproveDocumentsInput
): Promise<Prospect> {
  return api.post<Prospect>(`/prospects/${id}/approve-documents`, input);
}

/**
 * Reject prospect documents
 */
export function rejectDocuments(
  id: string,
  input: RejectDocumentsInput
): Promise<Prospect> {
  return api.post<Prospect>(`/prospects/${id}/reject-documents`, input);
}

/**
 * Convert prospect to investor
 */
export function convertToInvestor(
  id: string,
  input: ConvertToInvestorInput
): Promise<{ prospect: Prospect; investorId: string }> {
  return api.post<{ prospect: Prospect; investorId: string }>(
    `/prospects/${id}/convert`,
    input
  );
}

/**
 * Send reminder to prospect
 */
export function sendReminder(
  id: string,
  type: 'kyc' | 'onboarding'
): Promise<void> {
  return api.post<void>(`/prospects/${id}/send-reminder`, { type });
}

/**
 * Send DocuSign to prospect
 */
export function sendDocuSign(id: string): Promise<{ envelopeId: string }> {
  return api.post<{ envelopeId: string }>(`/prospects/${id}/send-docusign`, {});
}

/**
 * Submit interest form (public - no auth)
 */
export function submitInterestForm(input: {
  email: string;
  name: string;
  phone?: string;
  fundId: string;
}): Promise<{ prospectId: string }> {
  return api.post<{ prospectId: string }>('/kyc/interest', input);
}

/**
 * Get KYC application by token (for manual send links)
 */
export function getKYCByToken(token: string): Promise<{
  prospectId: string;
  fundId: string;
  fundName: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
}> {
  return api.get(`/kyc/token/${token}`);
}

