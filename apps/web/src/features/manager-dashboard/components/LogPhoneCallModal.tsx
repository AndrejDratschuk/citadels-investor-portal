import { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CallDirection } from '@flowveda/shared';

interface LogPhoneCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content?: string;
    occurredAt: string;
    callDirection: CallDirection;
    callDurationMinutes?: number;
  }) => void;
  isLoading?: boolean;
}

export function LogPhoneCallModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: LogPhoneCallModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [callDirection, setCallDirection] = useState<CallDirection>('outbound');
  const [durationMinutes, setDurationMinutes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      content: content || undefined,
      occurredAt: new Date(occurredAt).toISOString(),
      callDirection,
      callDurationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
    });
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setCallDirection('outbound');
    setDurationMinutes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold">Log Phone Call</h2>
          </div>
          <button onClick={handleClose} disabled={isLoading}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Subject / Title *</Label>
            <Input
              id="title"
              placeholder="What was the call about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction">Call Direction *</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCallDirection('outbound')}
                disabled={isLoading}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  callDirection === 'outbound'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                I called them
              </button>
              <button
                type="button"
                onClick={() => setCallDirection('inbound')}
                disabled={isLoading}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  callDirection === 'inbound'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                They called me
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occurredAt">Date & Time *</Label>
              <Input
                id="occurredAt"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="Optional"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Notes</Label>
            <textarea
              id="content"
              placeholder="Add any notes about the conversation..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title}>
              {isLoading ? 'Saving...' : 'Log Call'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

