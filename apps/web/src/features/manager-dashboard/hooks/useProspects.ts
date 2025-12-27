/**
 * useProspects Hook
 * React Query hooks for prospect management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as prospectsApi from '../../../lib/api/prospects';
import type {
  Prospect,
  PipelineMetrics,
  ProspectFilters,
  SendKYCInput,
  UpdateProspectStatusInput,
  ApproveDocumentsInput,
  RejectDocumentsInput,
  ConvertToInvestorInput,
} from '@flowveda/shared';

const PROSPECTS_KEY = 'prospects';
const PIPELINE_STATS_KEY = 'pipeline-stats';

/**
 * Hook to get all prospects with optional filters
 */
export function useProspects(filters?: ProspectFilters) {
  return useQuery({
    queryKey: [PROSPECTS_KEY, filters],
    queryFn: () => prospectsApi.getProspects(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get pipeline statistics
 */
export function usePipelineStats() {
  return useQuery({
    queryKey: [PIPELINE_STATS_KEY],
    queryFn: prospectsApi.getPipelineStats,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get a single prospect by ID
 */
export function useProspect(id: string) {
  return useQuery({
    queryKey: [PROSPECTS_KEY, id],
    queryFn: () => prospectsApi.getProspect(id),
    enabled: !!id,
  });
}

/**
 * Hook to send KYC form to a new prospect
 */
export function useSendKYC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendKYCInput) => prospectsApi.sendKYC(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROSPECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_STATS_KEY] });
    },
  });
}

/**
 * Hook to update prospect status
 */
export function useUpdateProspectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProspectStatusInput }) =>
      prospectsApi.updateProspectStatus(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROSPECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_STATS_KEY] });
      queryClient.setQueryData([PROSPECTS_KEY, variables.id], data);
    },
  });
}

/**
 * Hook to update prospect notes
 */
export function useUpdateProspectNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      prospectsApi.updateProspectNotes(id, notes),
    onSuccess: (data, variables) => {
      queryClient.setQueryData([PROSPECTS_KEY, variables.id], data);
    },
  });
}

/**
 * Hook to approve prospect documents
 */
export function useApproveDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApproveDocumentsInput }) =>
      prospectsApi.approveDocuments(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROSPECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_STATS_KEY] });
    },
  });
}

/**
 * Hook to reject prospect documents
 */
export function useRejectDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectDocumentsInput }) =>
      prospectsApi.rejectDocuments(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROSPECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_STATS_KEY] });
    },
  });
}

/**
 * Hook to convert prospect to investor
 */
export function useConvertToInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ConvertToInvestorInput }) =>
      prospectsApi.convertToInvestor(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROSPECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_STATS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}

/**
 * Hook to send reminder to prospect
 */
export function useSendReminder() {
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'kyc' | 'onboarding' }) =>
      prospectsApi.sendReminder(id, type),
  });
}

