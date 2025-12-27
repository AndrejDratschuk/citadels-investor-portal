/**
 * ShareKYCLinkModal
 * Modal for quickly copying the shareable KYC form URL
 */

import { useState } from 'react';
import { X, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFund } from '@/hooks/useFund';

interface ShareKYCLinkModalProps {
  open: boolean;
  onClose: () => void;
}

export function ShareKYCLinkModal({ open, onClose }: ShareKYCLinkModalProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);
  const { data: fund, isLoading } = useFund();

  if (!open) return null;

  const kycUrl = fund ? `${window.location.origin}/kyc/${fund.id}` : '';

  const handleCopy = async (): Promise<void> => {
    if (!kycUrl) return;
    await navigator.clipboard.writeText(kycUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Share KYC Form</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Share this link with potential investors to let them complete the KYC pre-qualification form.
        </p>

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : fund ? (
          <div className="space-y-4">
            {/* URL Display */}
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 font-mono text-sm truncate">
                {kycUrl}
              </div>
              <Button onClick={handleCopy} variant={copied ? 'default' : 'outline'}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Anyone with this link can start a KYC application for {fund.name}.
            </p>
          </div>
        ) : (
          <div className="text-center py-4 text-red-500">
            Could not load fund information.
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

