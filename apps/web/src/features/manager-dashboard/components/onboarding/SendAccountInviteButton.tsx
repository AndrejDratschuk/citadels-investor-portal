import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Loader2, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api/kyc';
import { KYCApplication } from './types';
import { getKycDisplayName } from './kycHelpers';

interface SendAccountInviteButtonProps {
  app: KYCApplication;
  disabled?: boolean;
}

export function SendAccountInviteButton({ app, disabled = false }: SendAccountInviteButtonProps) {
  const queryClient = useQueryClient();
  const [showCopied, setShowCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Generate the account creation URL
  const baseUrl = import.meta.env.PROD
    ? window.location.origin
    : window.location.origin;
  const accountCreationUrl = `${baseUrl}/create-account/${app.id}/${app.fundId}`;

  // Send account invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: () => kycApi.sendAccountInvite(app.id),
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const handleSendInvite = () => {
    sendInviteMutation.mutate();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(accountCreationUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const isLoading = sendInviteMutation.isPending;

  // Only show for meeting_complete status
  if (app.status !== 'meeting_complete') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {showSuccess ? (
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Invite Sent to {getKycDisplayName(app)}
        </span>
      ) : (
        <>
          <Button
            size="sm"
            onClick={handleSendInvite}
            disabled={disabled || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-1.5 h-4 w-4" />
                Send Account Invite
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            title="Copy account creation link"
          >
            {showCopied ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(accountCreationUrl, '_blank')}
            title="Preview account creation page"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </>
      )}

      {sendInviteMutation.isError && (
        <span className="text-sm text-red-600">
          Failed to send invite. Please try again.
        </span>
      )}
    </div>
  );
}

