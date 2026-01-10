/**
 * Note Form - Create/Edit form with visibility checkboxes
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { DealNote, NoteVisibility } from '@altsui/shared';

interface NoteFormProps {
  note?: DealNote;
  onSubmit: (data: { content: string; visibility: NoteVisibility[] }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const VISIBILITY_OPTIONS: { value: NoteVisibility; label: string; description: string }[] = [
  { value: 'manager', label: 'Fund Managers', description: 'Internal team only' },
  { value: 'accountant', label: 'Accountants', description: 'Tax and financial team' },
  { value: 'attorney', label: 'Attorneys', description: 'Legal team' },
  { value: 'investor', label: 'Investors', description: 'Visible to investors' },
];

export function NoteForm({
  note,
  onSubmit,
  onCancel,
  isSubmitting,
}: NoteFormProps): JSX.Element {
  const [content, setContent] = useState(note?.content ?? '');
  const [visibility, setVisibility] = useState<NoteVisibility[]>(
    note?.visibility ?? ['manager']
  );

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setVisibility(note.visibility);
    }
  }, [note]);

  const handleVisibilityToggle = (value: NoteVisibility): void => {
    setVisibility((prev) => {
      if (prev.includes(value)) {
        // Don't allow removing all visibility options
        if (prev.length === 1) return prev;
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (content.trim() && visibility.length > 0) {
      onSubmit({ content: content.trim(), visibility });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Content */}
      <div>
        <Label htmlFor="note-content" className="text-sm font-medium">
          Note Content
        </Label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your note here..."
          className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>

      {/* Visibility */}
      <div>
        <Label className="text-sm font-medium">Who can see this note?</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                visibility.includes(option.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <input
                type="checkbox"
                checked={visibility.includes(option.value)}
                onChange={() => handleVisibilityToggle(option.value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {note ? 'Update Note' : 'Add Note'}
        </Button>
      </div>
    </form>
  );
}

