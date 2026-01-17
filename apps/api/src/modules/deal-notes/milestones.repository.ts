/**
 * Milestones Repository (Data Access Layer)
 * Simple data fetching with no business logic
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type { DealMilestone, MilestoneStatus, MilestoneCategory } from '@altsui/shared';

interface MilestoneRow {
  id: string;
  deal_id: string;
  fund_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: MilestoneStatus;
  category: MilestoneCategory;
  actual_start_date: string | null;
  actual_completion_date: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToMilestone(row: MilestoneRow): DealMilestone {
  return {
    id: row.id,
    dealId: row.deal_id,
    fundId: row.fund_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    category: row.category,
    actualStartDate: row.actual_start_date,
    actualCompletionDate: row.actual_completion_date,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MilestonesRepository {
  async listByDealId(dealId: string): Promise<DealMilestone[]> {
    const { data, error } = await supabaseAdmin
      .from('deal_milestones')
      .select('*')
      .eq('deal_id', dealId)
      .order('sort_order', { ascending: true })
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      throw new Error('Failed to fetch milestones');
    }

    return (data ?? []).map(mapRowToMilestone);
  }

  async getById(milestoneId: string): Promise<DealMilestone | null> {
    const { data, error } = await supabaseAdmin
      .from('deal_milestones')
      .select('*')
      .eq('id', milestoneId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching milestone:', error);
      throw new Error('Failed to fetch milestone');
    }

    return data ? mapRowToMilestone(data) : null;
  }

  async create(input: {
    dealId: string;
    fundId: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    status?: MilestoneStatus;
    category?: MilestoneCategory;
    sortOrder?: number;
    createdBy: string;
  }): Promise<DealMilestone> {
    const { data, error } = await supabaseAdmin
      .from('deal_milestones')
      .insert({
        deal_id: input.dealId,
        fund_id: input.fundId,
        title: input.title,
        description: input.description ?? null,
        start_date: input.startDate,
        end_date: input.endDate ?? null,
        status: input.status ?? 'planned',
        category: input.category ?? 'other',
        sort_order: input.sortOrder ?? 0,
        created_by: input.createdBy,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      throw new Error('Failed to create milestone');
    }

    return mapRowToMilestone(data);
  }

  async update(milestoneId: string, input: {
    title?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string | null;
    status?: MilestoneStatus;
    category?: MilestoneCategory;
    actualStartDate?: string | null;
    actualCompletionDate?: string | null;
    sortOrder?: number;
  }): Promise<DealMilestone> {
    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.startDate !== undefined) updateData.start_date = input.startDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.actualStartDate !== undefined) updateData.actual_start_date = input.actualStartDate;
    if (input.actualCompletionDate !== undefined) updateData.actual_completion_date = input.actualCompletionDate;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    const { data, error } = await supabaseAdmin
      .from('deal_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      throw new Error('Failed to update milestone');
    }

    return mapRowToMilestone(data);
  }

  async delete(milestoneId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('deal_milestones')
      .delete()
      .eq('id', milestoneId);

    if (error) {
      console.error('Error deleting milestone:', error);
      throw new Error('Failed to delete milestone');
    }
  }
}

