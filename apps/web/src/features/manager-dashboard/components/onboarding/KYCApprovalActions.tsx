import { useState } from 'react';
import { CheckCircle2, XCircle, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KYCApplication } from './types';
import { getForm2BaseUrl } from './kycHelpers';
import { SendAccountInviteButton } from './SendAccountInviteButton';

interface KYCApprovalActionsProps {
  app: KYCApplication;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSendForm2: (app: KYCApplication) => void;
  isLoading?: boolean;
}

export function KYCApprovalActions({
  app,
  onApprove,
  onReject,
  onSendForm2,
  isLoading = false,
}: KYCApprovalActionsProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

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

  // Use fundCode if available, otherwise fallback to fundId
  const fundIdentifier = app.fundCode || app.fundId;
  const form2Url = `${getForm2BaseUrl()}/onboard/${fundIdentifier}?kyc=${app.id}`;
  const needsForm2 = app.status === 'meeting_complete' && !app.onboardingApplicationId;
  const hasForm2 = !!app.onboardingApplicationId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Approval Actions for Submitted Status */}
      {app.status === 'submitted' && (
        <>
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
        </>
      )}

      {/* Send Account Invite after Meeting Complete */}
      {app.status === 'meeting_complete' && (
        <SendAccountInviteButton app={app} disabled={isLoading} />
      )}

      {/* Legacy: Send Form 2 Link after Meeting Complete (if not using account creation flow) */}
      {needsForm2 && app.status !== 'meeting_complete' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSendForm2(app)}
          disabled={isLoading}
        >
          <Link2 className="mr-1.5 h-4 w-4" />
          Send Form 2 Link
        </Button>
      )}

      {/* Form 2 Already Sent */}
      {hasForm2 && (
        <span className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          Form 2 Sent
        </span>
      )}

      {/* Copy Form 2 Link */}
      {(app.status === 'pre_qualified' || app.status === 'meeting_scheduled' || app.status === 'meeting_complete') && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(form2Url);
          }}
          title="Copy Form 2 Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

