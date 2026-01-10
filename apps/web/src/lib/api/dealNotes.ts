/**
 * Deal Notes & Milestones API Client
 */

import { api } from './client';
import type {
  DealNote,
  DealMilestone,
  CreateDealNoteInput,
  UpdateDealNoteInput,
  CreateDealMilestoneInput,
  UpdateDealMilestoneInput,
  DealNotesListResponse,
  DealMilestonesListResponse,
} from '@altsui/shared';

// ============================================
// Notes API
// ============================================

export const notesApi = {
  async list(dealId: string): Promise<DealNotesListResponse> {
    return api.get<DealNotesListResponse>(`/deals/${dealId}/notes`);
  },

  async create(input: CreateDealNoteInput): Promise<DealNote> {
    return api.post<DealNote>(`/deals/${input.dealId}/notes`, {
      content: input.content,
      visibility: input.visibility,
    });
  },

  async update(dealId: string, noteId: string, input: UpdateDealNoteInput): Promise<DealNote> {
    return api.put<DealNote>(`/deals/${dealId}/notes/${noteId}`, input);
  },

  async delete(dealId: string, noteId: string): Promise<void> {
    return api.delete(`/deals/${dealId}/notes/${noteId}`);
  },
};

// ============================================
// Milestones API
// ============================================

export const milestonesApi = {
  async list(dealId: string): Promise<DealMilestonesListResponse> {
    return api.get<DealMilestonesListResponse>(`/deals/${dealId}/milestones`);
  },

  async create(input: CreateDealMilestoneInput): Promise<DealMilestone> {
    return api.post<DealMilestone>(`/deals/${input.dealId}/milestones`, {
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      category: input.category,
      sortOrder: input.sortOrder,
    });
  },

  async update(
    dealId: string,
    milestoneId: string,
    input: UpdateDealMilestoneInput
  ): Promise<DealMilestone> {
    return api.put<DealMilestone>(`/deals/${dealId}/milestones/${milestoneId}`, input);
  },

  async delete(dealId: string, milestoneId: string): Promise<void> {
    return api.delete(`/deals/${dealId}/milestones/${milestoneId}`);
  },
};

