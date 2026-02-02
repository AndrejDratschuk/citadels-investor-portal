import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, X, Loader2, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { emailApi } from '@/lib/api/email';
import { communicationsApi } from '@/lib/api/communications';
import type { Communication } from './communicationsConfig';

interface InvestorOption {
  id: string;
  name: string;
  email: string;
}

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  investors: InvestorOption[];
  onSuccess: () => void;
  replyTo?: Communication | null;
  forwardFrom?: Communication | null;
}

export function ComposeEmailModal({
  isOpen,
  onClose,
  investors,
  onSuccess,
  replyTo,
  forwardFrom,
}: ComposeEmailModalProps): JSX.Element | null {
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine mode
  const isReply = !!replyTo;
  const isForward = !!forwardFrom;
  const originalCommunication = replyTo || forwardFrom;

  // Get email connection status
  const { data: emailStatus } = useQuery({
    queryKey: ['email', 'status'],
    queryFn: emailApi.getStatus,
  });

  // Pre-fill fields when opening in reply/forward mode
  useEffect(() => {
    if (isOpen && originalCommunication) {
      const originalSubject = originalCommunication.title;
      const originalContent = originalCommunication.content || '';
      const originalDate = formatDate(originalCommunication.occurredAt);
      const originalFrom =
        originalCommunication.emailFrom || originalCommunication.investor.email;

      if (isReply) {
        // Reply mode: pre-select investor and set Re: subject
        setSelectedInvestorId(originalCommunication.investor.id);
        setSubject(
          originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`
        );
        setBody(
          `\n\n---\nOn ${originalDate}, ${originalFrom} wrote:\n\n${originalContent}`
        );
      } else if (isForward) {
        // Forward mode: just set Fwd: subject and include original message
        setSelectedInvestorId('');
        setSubject(
          originalSubject.startsWith('Fwd:') ? originalSubject : `Fwd: ${originalSubject}`
        );
        setBody(
          `\n\n---\nForwarded message:\nFrom: ${originalFrom}\nDate: ${originalDate}\nSubject: ${originalSubject}\n\n${originalContent}`
        );
      }
    }
  }, [isOpen, originalCommunication, isReply, isForward]);

  const selectedInvestor = investors.find((i) => i.id === selectedInvestorId);

  async function handleSend(): Promise<void> {
    if (!selectedInvestor || !subject.trim() || !body.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailStatus?.connected) {
      setError('Please connect your email account in Settings first');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Send the email
      const result = await emailApi.send({
        to: selectedInvestor.email,
        subject: subject.trim(),
        body: body.trim(),
      });

      // Log the communication in the database
      await communicationsApi.create(selectedInvestorId, {
        type: 'email',
        title: subject.trim(),
        content: body.trim(),
        occurredAt: new Date().toISOString(),
        emailFrom: result.from,
        emailTo: selectedInvestor.email,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      setError(message);
    } finally {
      setSending(false);
    }
  }

  function resetForm(): void {
    setSelectedInvestorId('');
    setSubject('');
    setBody('');
    setError(null);
    setSuccess(false);
  }

  function handleClose(): void {
    resetForm();
    onClose();
  }

  // Get modal title based on mode
  const modalTitle = isReply ? 'Reply to Email' : isForward ? 'Forward Email' : 'Compose Email';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-card rounded-xl shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {modalTitle}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email Status Warning/Success */}
        <EmailStatusBanner connected={emailStatus?.connected} email={emailStatus?.email} />

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Recipient */}
          <RecipientField
            investors={investors}
            selectedInvestorId={selectedInvestorId}
            selectedInvestor={selectedInvestor}
            isReply={isReply}
            onChange={setSelectedInvestorId}
          />

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Message:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={8}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Email sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              !selectedInvestorId ||
              !subject.trim() ||
              !body.trim() ||
              !emailStatus?.connected
            }
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================
interface EmailStatusBannerProps {
  connected?: boolean;
  email?: string | null;
}

function EmailStatusBanner({ connected, email }: EmailStatusBannerProps): JSX.Element | null {
  if (!connected) {
    return (
      <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          No email connected.{' '}
          <Link to="/manager/settings" className="underline font-medium">
            Connect your email
          </Link>{' '}
          to send messages.
        </span>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-800">
      <CheckCircle className="h-4 w-4 flex-shrink-0" />
      <span>
        Sending from: <strong>{email}</strong>
      </span>
    </div>
  );
}

interface RecipientFieldProps {
  investors: InvestorOption[];
  selectedInvestorId: string;
  selectedInvestor: InvestorOption | undefined;
  isReply: boolean;
  onChange: (id: string) => void;
}

function RecipientField({
  investors,
  selectedInvestorId,
  selectedInvestor,
  isReply,
  onChange,
}: RecipientFieldProps): JSX.Element {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">To:</label>
      {isReply && selectedInvestor ? (
        // In reply mode, show the investor as read-only
        <div className="w-full rounded-lg border bg-muted px-3 py-2 text-sm">
          {selectedInvestor.name} ({selectedInvestor.email})
        </div>
      ) : (
        <select
          value={selectedInvestorId}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select an investor...</option>
          {investors.map((investor) => (
            <option key={investor.id} value={investor.id}>
              {investor.name} ({investor.email})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
