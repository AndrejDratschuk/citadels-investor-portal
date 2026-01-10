/**
 * Notes Controller (Request Handling Layer)
 * Handles HTTP requests and auth checks
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { NotesService } from './notes.service';
import { createDealNoteSchema, updateDealNoteSchema } from '@altsui/shared';
import { supabaseAdmin } from '../../common/database/supabase';

const notesService = new NotesService();

interface DealParams {
  dealId: string;
}

interface NoteParams extends DealParams {
  noteId: string;
}

async function getDealFundId(dealId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('deals')
    .select('fund_id')
    .eq('id', dealId)
    .single();
  return data?.fund_id ?? null;
}

export class NotesController {
  async list(
    request: FastifyRequest<{ Params: DealParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const { dealId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const result = await notesService.listNotes(dealId, user.role);
    return reply.send({ success: true, data: result });
  }

  async create(
    request: FastifyRequest<{ Params: DealParams; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    const { dealId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can create notes' });
    }

    const parsed = createDealNoteSchema.safeParse({ ...request.body, dealId });
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const fundId = await getDealFundId(dealId);
    if (!fundId) {
      return reply.status(404).send({ success: false, error: 'Deal not found' });
    }

    const note = await notesService.createNote({
      dealId: parsed.data.dealId,
      fundId,
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      createdBy: user.id,
    });

    return reply.status(201).send({ success: true, data: note });
  }

  async update(
    request: FastifyRequest<{ Params: NoteParams; Body: unknown }>,
    reply: FastifyReply
  ): Promise<void> {
    const { noteId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can update notes' });
    }

    const parsed = updateDealNoteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.issues });
    }

    const existingNote = await notesService.getNoteById(noteId);
    if (!existingNote) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    const updatedNote = await notesService.updateNote(noteId, parsed.data);
    return reply.send({ success: true, data: updatedNote });
  }

  async delete(
    request: FastifyRequest<{ Params: NoteParams }>,
    reply: FastifyReply
  ): Promise<void> {
    const { noteId } = request.params;
    const user = request.user;

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (user.role !== 'manager') {
      return reply.status(403).send({ success: false, error: 'Only managers can delete notes' });
    }

    const existingNote = await notesService.getNoteById(noteId);
    if (!existingNote) {
      return reply.status(404).send({ success: false, error: 'Note not found' });
    }

    await notesService.deleteNote(noteId);
    return reply.status(204).send();
  }
}

