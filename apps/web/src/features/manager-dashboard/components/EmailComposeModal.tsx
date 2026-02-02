import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Copy, Check, Send, Mail, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, EmailConnectionStatus } from '@/lib/api/email';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  defaultSubject: string;
  defaultBody: string;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export function EmailComposeModal({
  isOpen,
  onClose,
  recipientEmail,
  defaultSubject,
  defaultBody,
}: EmailComposeModalProps) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<EmailConnectionStatus | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Check email connection status when modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckingConnection(true);
      emailApi.getStatus()
        .then(setConnectionStatus)
        .catch(() => setConnectionStatus({ connected: false, provider: null, email: null }))
        .finally(() => setCheckingConnection(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    // Validate
    if (!to || !subject || !body) {
      setErrorMessage('Please fill in all fields');
      setSendStatus('error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      setErrorMessage('Please enter a valid email address');
      setSendStatus('error');
      return;
    }

    setSendStatus('sending');
    setErrorMessage('');

    try {
      await emailApi.send({ to, subject, body });
      setSendStatus('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        // Reset state for next use
        setSendStatus('idle');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setErrorMessage(err.message || 'Failed to send email. Please try again.');
      setSendStatus('error');
    }
  };

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setSendStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Compose Email</h2>
              <p className="text-sm text-muted-foreground">Send investor application link</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loading Connection Status */}
        {checkingConnection && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Checking email connection...</p>
          </div>
        )}

        {/* Not Connected State */}
        {!checkingConnection && !connectionStatus?.connected && sendStatus !== 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Mail className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Connect Your Email</h3>
            <p className="mt-2 text-muted-foreground max-w-sm">
              To send emails directly from the app, please connect your Gmail or Outlook account in Settings.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button asChild>
                <Link to="/manager/settings?tab=email">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {sendStatus === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-green-900">Email Sent!</h3>
            <p className="mt-2 text-green-700 text-center">
              Your email has been sent successfully to {to}
            </p>
            {connectionStatus?.email && (
              <p className="mt-1 text-sm text-green-600">
                Sent from {connectionStatus.email}
              </p>
            )}
          </div>
        )}

        {/* Form State */}
        {!checkingConnection && connectionStatus?.connected && sendStatus !== 'success' && (
          <>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Error Message */}
              {sendStatus === 'error' && errorMessage && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* To Field */}
              <div>
                <Label htmlFor="email-to" className="text-sm font-medium">
                  To
                </Label>
                <Input
                  id="email-to"
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1.5"
                  placeholder="recipient@example.com"
                  disabled={sendStatus === 'sending'}
                />
              </div>

              {/* Subject Field */}
              <div>
                <Label htmlFor="email-subject" className="text-sm font-medium">
                  Subject
                </Label>
                <Input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1.5"
                  placeholder="Email subject"
                  disabled={sendStatus === 'sending'}
                />
              </div>

              {/* Body Field */}
              <div>
                <Label htmlFor="email-body" className="text-sm font-medium">
                  Message
                </Label>
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  disabled={sendStatus === 'sending'}
                  className={cn(
                    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "ring-offset-background placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "resize-none font-mono",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  placeholder="Email body..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleClose} disabled={sendStatus === 'sending'}>
                  Cancel
                </Button>
                {connectionStatus?.email && (
                  <span className="text-xs text-muted-foreground">
                    Sending from {connectionStatus.email}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyBody}
                  disabled={sendStatus === 'sending'}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Message
                    </>
                  )}
                </Button>
                <Button onClick={handleSendEmail} disabled={sendStatus === 'sending'}>
                  {sendStatus === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
