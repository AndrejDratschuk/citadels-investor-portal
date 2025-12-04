import { useState } from 'react';
import { X, Phone, Mail, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommunicationType, CallDirection } from '@flowveda/shared';
import { cn } from '@/lib/utils';

export interface LogCommunicationData {
  type: CommunicationType;
  title: string;
  content?: string;
  occurredAt: string;
  // Phone call specific
  callDirection?: CallDirection;
  callDurationMinutes?: number;
  // Email specific
  emailFrom?: string;
  emailTo?: string;
  // Meeting specific
  meetingAttendees?: string[];
  meetingDurationMinutes?: number;
}

interface LogCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LogCommunicationData) => void;
  isLoading?: boolean;
  investorEmail?: string;
}

const typeOptions: { id: CommunicationType; label: string; icon: typeof Phone; color: string }[] = [
  { id: 'phone_call', label: 'Phone Call', icon: Phone, color: 'bg-green-100 text-green-600' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-600' },
  { id: 'meeting', label: 'Meeting', icon: Video, color: 'bg-purple-100 text-purple-600' },
];

export function LogCommunicationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  investorEmail,
}: LogCommunicationModalProps) {
  const [type, setType] = useState<CommunicationType>('phone_call');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  
  // Phone call fields
  const [callDirection, setCallDirection] = useState<CallDirection>('outbound');
  const [callDuration, setCallDuration] = useState('');
  
  // Email fields
  const [emailFrom, setEmailFrom] = useState('');
  const [emailTo, setEmailTo] = useState(investorEmail || '');
  
  // Meeting fields
  const [meetingAttendees, setMeetingAttendees] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData = {
      type,
      title,
      content: content || undefined,
      occurredAt: new Date(occurredAt).toISOString(),
    };

    let typeSpecificData = {};
    
    if (type === 'phone_call') {
      typeSpecificData = {
        callDirection,
        callDurationMinutes: callDuration ? parseInt(callDuration, 10) : undefined,
      };
    } else if (type === 'email') {
      typeSpecificData = {
        emailFrom: emailFrom || undefined,
        emailTo: emailTo || undefined,
      };
    } else if (type === 'meeting') {
      typeSpecificData = {
        meetingAttendees: meetingAttendees 
          ? meetingAttendees.split(',').map(a => a.trim()).filter(Boolean)
          : undefined,
        meetingDurationMinutes: meetingDuration ? parseInt(meetingDuration, 10) : undefined,
      };
    }

    onSubmit({ ...baseData, ...typeSpecificData });
  };

  const handleClose = () => {
    setType('phone_call');
    setTitle('');
    setContent('');
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setCallDirection('outbound');
    setCallDuration('');
    setEmailFrom('');
    setEmailTo(investorEmail || '');
    setMeetingAttendees('');
    setMeetingDuration('');
    onClose();
  };

  const selectedType = typeOptions.find(t => t.id === type)!;
  const TypeIcon = selectedType.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', selectedType.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold">Log Communication</h2>
          </div>
          <button onClick={handleClose} disabled={isLoading}>
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Communication Type Selector */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setType(option.id)}
                    disabled={isLoading}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      type === option.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title/Subject */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {type === 'email' ? 'Subject Line' : 'Title / Subject'} *
            </Label>
            <Input
              id="title"
              placeholder={
                type === 'email' 
                  ? 'Email subject line...'
                  : type === 'meeting'
                  ? 'Meeting topic...'
                  : 'What was the call about?'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Phone Call Specific Fields */}
          {type === 'phone_call' && (
            <>
              <div className="space-y-2">
                <Label>Call Direction *</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCallDirection('outbound')}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      callDirection === 'outbound'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    I called them
                  </button>
                  <button
                    type="button"
                    onClick={() => setCallDirection('inbound')}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      callDirection === 'inbound'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    They called me
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callDuration">Duration (minutes)</Label>
                <Input
                  id="callDuration"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Email Specific Fields */}
          {type === 'email' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emailFrom">From</Label>
                <Input
                  id="emailFrom"
                  type="email"
                  placeholder="sender@example.com"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailTo">To</Label>
                <Input
                  id="emailTo"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Meeting Specific Fields */}
          {type === 'meeting' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="meetingAttendees">Attendees</Label>
                <Input
                  id="meetingAttendees"
                  placeholder="John Smith, Jane Doe (comma separated)"
                  value={meetingAttendees}
                  onChange={(e) => setMeetingAttendees(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingDuration">Duration (minutes)</Label>
                <Input
                  id="meetingDuration"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* Date/Time */}
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

          {/* Notes/Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {type === 'email' ? 'Email Content / Summary' : type === 'meeting' ? 'Meeting Notes' : 'Notes'}
            </Label>
            <textarea
              id="content"
              placeholder={
                type === 'email'
                  ? 'Paste or summarize the email content...'
                  : type === 'meeting'
                  ? 'Add meeting notes, action items, or transcript...'
                  : 'Add any notes about the conversation...'
              }
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
              {isLoading ? 'Saving...' : 'Log Communication'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Keep backward compatibility export
export { LogCommunicationModal as LogPhoneCallModal };


