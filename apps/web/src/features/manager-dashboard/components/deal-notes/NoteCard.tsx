/**
 * Note Card - Displays a single note with visibility badges
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisibilityBadge } from './VisibilityBadge';
import type { DealNote } from '@altsui/shared';

interface NoteCardProps {
  note: DealNote;
  onEdit: (note: DealNote) => void;
  onDelete: (noteId: string) => void;
  isDeleting?: boolean;
}

export function NoteCard({ note, onEdit, onDelete, isDeleting }: NoteCardProps): JSX.Element {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium text-foreground">
            {note.createdByName || 'Unknown'}
          </span>
          <span>·</span>
          <span title={new Date(note.createdAt).toLocaleString()}>
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center gap-1 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(note)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(note.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 whitespace-pre-wrap text-sm">{note.content}</div>

      {/* Visibility Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {note.visibility.map((v) => (
          <VisibilityBadge key={v} visibility={v} />
        ))}
      </div>
    </div>
  );
}

