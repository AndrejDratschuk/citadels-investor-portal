/**
 * Notes Service (Business Logic Layer)
 * Handles visibility filtering and authorization
 */

import { NotesRepository } from './notes.repository';
import type { DealNote, NoteVisibility } from '@altsui/shared';

const notesRepository = new NotesRepository();

export class NotesService {
  async listNotes(
    dealId: string,
    userRole: string
  ): Promise<{ notes: DealNote[]; total: number }> {
    const allNotes = await notesRepository.listByDealId(dealId);
    
    // Managers see all notes, others see based on visibility
    const filteredNotes = userRole === 'manager'
      ? allNotes
      : allNotes.filter(note => note.visibility.includes(userRole as NoteVisibility));

    return {
      notes: filteredNotes,
      total: filteredNotes.length,
    };
  }

  async getNoteById(noteId: string): Promise<DealNote | null> {
    return notesRepository.getById(noteId);
  }

  async createNote(input: {
    dealId: string;
    fundId: string;
    content: string;
    visibility: NoteVisibility[];
    createdBy: string;
  }): Promise<DealNote> {
    return notesRepository.create(input);
  }

  async updateNote(
    noteId: string,
    input: { content?: string; visibility?: NoteVisibility[] }
  ): Promise<DealNote> {
    return notesRepository.update(noteId, input);
  }

  async deleteNote(noteId: string): Promise<void> {
    return notesRepository.delete(noteId);
  }
}

