import { useState } from 'react';
import { CheckCircle2, XCircle, Link2, Loader2, Copy, Check, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KYCApplication } from './types';
import { getOnboardingBaseUrl } from './kycHelpers';
import { SendAccountInviteButton } from './SendAccountInviteButton';

interface KYCApprovalActionsProps {
  app: KYCApplication;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSendOnboardingLink: (app: KYCApplication) => void;
  isLoading?: boolean;
}

export function KYCApprovalActions({
  app,
  onApprove,
  onReject,
  onSendOnboardingLink,
  isLoading = false,
}: KYCApprovalActionsProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleApprove = async (): Promise<void> => {
    setActionLoading('approve');
    await onApprove(app.id);
    setActionLoading(null);
  };

  const handleReject = async (): Promise<void> => {
    if (!rejectReason.trim()) return;
    setActionLoading('reject');
    await onReject(app.id, rejectReason);
    setActionLoading(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(onboardingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Use fundCode if available, otherwise fallback to fundId
  const fundIdentifier = app.fundCode || app.fundId;
  const onboardingUrl = `${getOnboardingBaseUrl()}/onboard/${fundIdentifier}?kyc=${app.id}`;
  const needsOnboardingLink = app.status === 'meeting_complete' && !app.onboardingApplicationId;
  const hasOnboardingApp = !!app.onboardingApplicationId;

  return (
    <div className="space-y-4">
      {/* Approval Actions for Submitted Status */}
      {app.status === 'submitted' && (
        <div className="flex flex-wrap items-center gap-2">
          {!showRejectInput ? (
            <>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isLoading || actionLoading !== null}
              >
                {actionLoading === 'approve' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRejectInput(true)}
                disabled={isLoading || actionLoading !== null}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                Reject
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-48"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === 'reject'}
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Actions for Meeting Complete Status */}
      {app.status === 'meeting_complete' && (
        <div className="flex flex-wrap items-center gap-2">
          <SendAccountInviteButton app={app} disabled={isLoading} />

          {/* Send Onboarding Link - available when no onboarding app yet */}
          {needsOnboardingLink && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSendOnboardingLink(app)}
              disabled={isLoading}
            >
              <Link2 className="mr-1.5 h-4 w-4" />
              Send Onboarding Link
            </Button>
          )}

          {/* Onboarding Application Already Submitted */}
          {hasOnboardingApp && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Onboarding Submitted
            </span>
          )}
        </div>
      )}

      {/* Approved - Show Onboarding Form Link */}
      {app.status === 'pre_qualified' && (
        <div>
          <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
            <CheckCircle2 className="h-4 w-4" />
            Pre-qualified. Send them the investor onboarding form:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-0 rounded-lg border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
              {onboardingUrl}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => onSendOnboardingLink(app)}
                disabled={isLoading}
              >
                <Send className="mr-2 h-4 w-4" />
                Email Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Status */}
      {app.status === 'not_eligible' && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          Application rejected - not eligible.
        </div>
      )}
    </div>
  );
}

