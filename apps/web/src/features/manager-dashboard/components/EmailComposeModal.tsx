import { useState } from 'react';
import { X, Copy, Check, Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
  defaultSubject: string;
  defaultBody: string;
}

export function EmailComposeModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
  defaultSubject,
  defaultBody,
}: EmailComposeModalProps) {
  const [to, setTo] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAll = async () => {
    const fullEmail = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenInEmailClient = () => {
    const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
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
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              className={cn(
                "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "resize-none font-mono"
              )}
              placeholder="Email body..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyBody}
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
            <Button onClick={handleOpenInEmailClient}>
              <Send className="mr-2 h-4 w-4" />
              Open in Email App
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

