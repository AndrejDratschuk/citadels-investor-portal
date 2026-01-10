/**
 * Notes Repository (Data Access Layer)
 * Simple data fetching with no business logic
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type { DealNote, NoteVisibility } from '@altsui/shared';

interface NoteRow {
  id: string;
  deal_id: string;
  fund_id: string;
  content: string;
  visibility: NoteVisibility[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  users?: { first_name: string; last_name: string } | null;
}

function mapRowToNote(row: NoteRow): DealNote {
  return {
    id: row.id,
    dealId: row.deal_id,
    fundId: row.fund_id,
    content: row.content,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.users ? `${row.users.first_name} ${row.users.last_name}` : undefined,
  };
}

export class NotesRepository {
  async listByDealId(dealId: string): Promise<DealNote[]> {
    const { data, error } = await supabaseAdmin
      .from('deal_notes')
      .select(`*, users:created_by(first_name, last_name)`)
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deal notes:', error);
      throw new Error('Failed to fetch notes');
    }

    return (data ?? []).map(mapRowToNote);
  }

  async getById(noteId: string): Promise<DealNote | null> {
    const { data, error } = await supabaseAdmin
      .from('deal_notes')
      .select(`*, users:created_by(first_name, last_name)`)
      .eq('id', noteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching note:', error);
      throw new Error('Failed to fetch note');
    }

    return data ? mapRowToNote(data) : null;
  }

  async create(input: {
    dealId: string;
    fundId: string;
    content: string;
    visibility: NoteVisibility[];
    createdBy: string;
  }): Promise<DealNote> {
    const { data, error } = await supabaseAdmin
      .from('deal_notes')
      .insert({
        deal_id: input.dealId,
        fund_id: input.fundId,
        content: input.content,
        visibility: input.visibility,
        created_by: input.createdBy,
      })
      .select(`*, users:created_by(first_name, last_name)`)
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw new Error('Failed to create note');
    }

    return mapRowToNote(data);
  }

  async update(noteId: string, input: {
    content?: string;
    visibility?: NoteVisibility[];
  }): Promise<DealNote> {
    const updateData: Record<string, unknown> = {};
    if (input.content !== undefined) updateData.content = input.content;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;

    const { data, error } = await supabaseAdmin
      .from('deal_notes')
      .update(updateData)
      .eq('id', noteId)
      .select(`*, users:created_by(first_name, last_name)`)
      .single();

    if (error) {
      console.error('Error updating note:', error);
      throw new Error('Failed to update note');
    }

    return mapRowToNote(data);
  }

  async delete(noteId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('deal_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      throw new Error('Failed to delete note');
    }
  }
}

