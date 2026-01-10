/**
 * React Query hooks for Deal Notes & Milestones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, milestonesApi } from '@/lib/api/dealNotes';
import type {
  CreateDealNoteInput,
  UpdateDealNoteInput,
  CreateDealMilestoneInput,
  UpdateDealMilestoneInput,
} from '@altsui/shared';

// ============================================
// Notes Hooks
// ============================================

export function useDealNotes(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-notes', dealId],
    queryFn: () => notesApi.list(dealId!),
    enabled: !!dealId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealNoteInput) => notesApi.create(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', variables.dealId] });
    },
  });
}

export function useUpdateNote(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: UpdateDealNoteInput }) =>
      notesApi.update(dealId, noteId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
    },
  });
}

export function useDeleteNote(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(dealId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-notes', dealId] });
    },
  });
}

// ============================================
// Milestones Hooks
// ============================================

export function useDealMilestones(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-milestones', dealId],
    queryFn: () => milestonesApi.list(dealId!),
    enabled: !!dealId,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDealMilestoneInput) => milestonesApi.create(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-milestones', variables.dealId] });
    },
  });
}

export function useUpdateMilestone(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, input }: { milestoneId: string; input: UpdateDealMilestoneInput }) =>
      milestonesApi.update(dealId, milestoneId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-milestones', dealId] });
    },
  });
}

export function useDeleteMilestone(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => milestonesApi.delete(dealId, milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-milestones', dealId] });
    },
  });
}

