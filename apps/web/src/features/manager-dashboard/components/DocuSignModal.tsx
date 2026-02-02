import { useState, useEffect } from 'react';
import { X, FileSignature, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { docuSignApi, DocuSignTemplate } from '@/lib/api/docusign';

interface DocuSignModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  investorEmail: string;
}

type ModalState = 'loading' | 'not_configured' | 'select_template' | 'sending' | 'success' | 'error';

export function DocuSignModal({
  isOpen,
  onClose,
  investorId,
  investorName,
  investorEmail,
}: DocuSignModalProps) {
  const [state, setState] = useState<ModalState>('loading');
  const [templates, setTemplates] = useState<DocuSignTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatusAndLoadTemplates();
    }
  }, [isOpen]);

  const checkStatusAndLoadTemplates = async () => {
    setState('loading');
    setError(null);

    try {
      const status = await docuSignApi.getStatus();
      
      if (!status.configured) {
        setState('not_configured');
        return;
      }

      const templateList = await docuSignApi.listTemplates();
      setTemplates(templateList);
      
      if (templateList.length > 0) {
        setSelectedTemplateId(templateList[0].id);
      }
      
      setState('select_template');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load DocuSign data';
      setError(message);
      setState('error');
    }
  };

  const handleSend = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    setState('sending');
    setError(null);

    try {
      await docuSignApi.sendEnvelope({
        templateId: selectedTemplateId,
        investorId,
        subject: subject.trim() || undefined,
        emailBody: emailBody.trim() || undefined,
      });

      setState('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        // Reset state for next use
        setState('loading');
        setSelectedTemplateId('');
        setSubject('');
        setEmailBody('');
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send document';
      setError(message);
      setState('error');
    }
  };

  const handleClose = () => {
    setState('loading');
    setSelectedTemplateId('');
    setSubject('');
    setEmailBody('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={state !== 'sending' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Send Document</h2>
              <p className="text-sm text-muted-foreground">
                Request e-signature from {investorName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={state === 'sending'}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Checking DocuSign connection...</p>
            </div>
          )}

          {/* Not Configured State */}
          {state === 'not_configured' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <FileSignature className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Connect DocuSign</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                To send documents for e-signature, please connect your DocuSign account in Settings.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button asChild>
                  <Link to="/manager/settings?tab=integrations">
                    <Settings className="mr-2 h-4 w-4" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Select Template State */}
          {state === 'select_template' && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template">Document Template</Label>
                <select
                  id="template"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {templates.length === 0 ? (
                    <option value="">No templates available</option>
                  ) : (
                    templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Please create templates in your DocuSign account first.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject (optional)</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Please sign your investment documents"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailBody">Email Message (optional)</Label>
                <textarea
                  id="emailBody"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={3}
                  placeholder="Please review and sign the attached documents."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  Document will be sent to:{' '}
                  <span className="font-medium text-foreground">{investorEmail}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSend} disabled={templates.length === 0}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Send for Signature
                </Button>
              </div>
            </div>
          )}

          {/* Sending State */}
          {state === 'sending' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Sending document...</p>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-green-900">Document Sent!</h3>
              <p className="mt-2 text-green-700 text-center">
                {investorName} will receive an email with a link to sign the document.
              </p>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">Something went wrong</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                {error || 'Failed to send document. Please try again.'}
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={checkStatusAndLoadTemplates}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

