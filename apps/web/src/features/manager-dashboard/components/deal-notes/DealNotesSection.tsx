/**
 * Deal Notes Section - Container with list + form
 */

import { useState } from 'react';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteCard } from './NoteCard';
import { NoteForm } from './NoteForm';
import {
  useDealNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '../../hooks/useDealNotes';
import type { DealNote, NoteVisibility } from '@altsui/shared';

interface DealNotesSectionProps {
  dealId: string;
}

export function DealNotesSection({ dealId }: DealNotesSectionProps): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<DealNote | null>(null);

  const { data, isLoading } = useDealNotes(dealId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote(dealId);
  const deleteNote = useDeleteNote(dealId);

  const handleCreate = (formData: { content: string; visibility: NoteVisibility[] }): void => {
    createNote.mutate(
      { dealId, ...formData },
      {
        onSuccess: () => {
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdate = (formData: { content: string; visibility: NoteVisibility[] }): void => {
    if (!editingNote) return;
    updateNote.mutate(
      { noteId: editingNote.id, input: formData },
      {
        onSuccess: () => {
          setEditingNote(null);
        },
      }
    );
  };

  const handleDelete = (noteId: string): void => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote.mutate(noteId);
    }
  };

  const notes = data?.notes ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Deal Notes</h3>
          <p className="text-sm text-muted-foreground">
            Communication hub for this deal with role-based visibility
          </p>
        </div>
        {!showForm && !editingNote && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      {/* Form - Create or Edit */}
      {(showForm || editingNote) && (
        <div className="rounded-xl border bg-card p-5">
          <h4 className="mb-4 font-medium">
            {editingNote ? 'Edit Note' : 'New Note'}
          </h4>
          <NoteForm
            note={editingNote ?? undefined}
            onSubmit={editingNote ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingNote(null);
            }}
            isSubmitting={createNote.isPending || updateNote.isPending}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="mt-3 h-16 w-full" />
              <div className="mt-3 flex gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes List */}
      {!isLoading && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={setEditingNote}
              onDelete={handleDelete}
              isDeleting={deleteNote.isPending}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notes.length === 0 && !showForm && (
        <div className="rounded-xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="mt-4 font-medium">No notes yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Add notes to track communications and updates for this deal
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add First Note
          </Button>
        </div>
      )}
    </div>
  );
}

