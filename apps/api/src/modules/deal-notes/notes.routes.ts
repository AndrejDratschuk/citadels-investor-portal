/**
 * Notes Routes
 */

import type { FastifyInstance } from 'fastify';
import { NotesController } from './notes.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const notesController = new NotesController();

export async function notesRoutes(fastify: FastifyInstance): Promise<void> {
  // List notes for a deal
  fastify.get('/deals/:dealId/notes', { preHandler: [authenticate] }, async (request, reply) => {
    return notesController.list(request as any, reply);
  });

  // Create a note
  fastify.post('/deals/:dealId/notes', { preHandler: [authenticate] }, async (request, reply) => {
    return notesController.create(request as any, reply);
  });

  // Update a note
  fastify.put('/deals/:dealId/notes/:noteId', { preHandler: [authenticate] }, async (request, reply) => {
    return notesController.update(request as any, reply);
  });

  // Delete a note
  fastify.delete('/deals/:dealId/notes/:noteId', { preHandler: [authenticate] }, async (request, reply) => {
    return notesController.delete(request as any, reply);
  });
}

