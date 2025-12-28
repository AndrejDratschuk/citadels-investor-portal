/**
 * ProspectActions
 * Renders contextual action buttons based on prospect status
 */

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Copy,
  Send,
  Mail,
  Check,
  Loader2,
  DollarSign,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useUpdateProspectStatus,
  useApproveDocuments,
  useRejectDocuments,
  useConvertToInvestor,
  useSendReminder,
} from '../../hooks/useProspects';
import { getProspectActions, buildOnboardingUrl } from './getProspectActions';
import type { Prospect, ProspectStatus } from '@altsui/shared';

interface ProspectActionsProps {
  prospect: Prospect;
  onRefresh: () => void;
  onClose: () => void;
}

export function ProspectActions({
  prospect,
  onRefresh,
  onClose,
}: ProspectActionsProps): JSX.Element {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [commitmentAmount, setCommitmentAmount] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const updateStatusMutation = useUpdateProspectStatus();
  const approveDocsMutation = useApproveDocuments();
  const rejectDocsMutation = useRejectDocuments();
  const convertMutation = useConvertToInvestor();
  const sendReminderMutation = useSendReminder();

  const config = getProspectActions(prospect.status as ProspectStatus);
  const onboardingUrl = buildOnboardingUrl(prospect.id, window.location.origin);

  const isLoading =
    updateStatusMutation.isPending ||
    approveDocsMutation.isPending ||
    rejectDocsMutation.isPending ||
    convertMutation.isPending ||
    sendReminderMutation.isPending;

  const handleCopyOnboardingLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(onboardingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEmailOnboardingLink = async (): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'account_invite_sent' as ProspectStatus },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to send email: ${message}`);
    }
  };

  const handleApproveKyc = async (): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'pre_qualified' as ProspectStatus },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to approve KYC: ${message}`);
    }
  };

  const handleRejectKyc = async (): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'not_eligible' as ProspectStatus },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to reject KYC: ${message}`);
    }
  };

  const handleSendAccountInvite = async (): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'account_invite_sent' as ProspectStatus },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to send account invite: ${message}`);
    }
  };

  const handleApproveDocuments = async (): Promise<void> => {
    try {
      await approveDocsMutation.mutateAsync({
        id: prospect.id,
        input: { documentIds: [] },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to approve documents: ${message}`);
    }
  };

  const handleRejectDocuments = async (): Promise<void> => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await rejectDocsMutation.mutateAsync({
        id: prospect.id,
        input: { documentIds: [], reason: rejectReason },
      });
      setShowRejectForm(false);
      setRejectReason('');
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to reject documents: ${message}`);
    }
  };

  const handleConvertToInvestor = async (): Promise<void> => {
    const amount = parseFloat(commitmentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid commitment amount');
      return;
    }
    try {
      await convertMutation.mutateAsync({
        id: prospect.id,
        input: { commitmentAmount: amount },
      });
      setShowConvertForm(false);
      setCommitmentAmount('');
      onRefresh();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to convert: ${message}`);
    }
  };

  const handleSendReminder = async (): Promise<void> => {
    const reminderType = prospect.status === 'kyc_sent' ? 'kyc' : 'onboarding';
    try {
      await sendReminderMutation.mutateAsync({ id: prospect.id, type: reminderType });
      alert('Reminder sent successfully!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to send reminder: ${message}`);
    }
  };

  const handleMarkNotEligible = async (): Promise<void> => {
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'not_eligible' as ProspectStatus },
      });
      onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update status: ${message}`);
    }
  };

  // Render forms if active
  if (showConvertForm) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-4">Convert to Investor</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Commitment Amount ($)</label>
            <input
              type="number"
              value={commitmentAmount}
              onChange={(e) => setCommitmentAmount(e.target.value)}
              placeholder="100000"
              className="w-full rounded-md border p-2 text-sm mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleConvertToInvestor}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-1 h-4 w-4" />
              )}
              Convert to Investor
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConvertForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showRejectForm) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-4">Reject Documents</h3>
        <div className="space-y-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full rounded-md border p-2 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectDocuments}
              disabled={rejectDocsMutation.isPending}
            >
              {rejectDocsMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-1 h-4 w-4" />
              )}
              Confirm Rejection
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render main actions
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium mb-4">Actions</h3>

      {/* Info Message */}
      {config.infoMessage && (
        <p className="text-sm text-muted-foreground mb-4">{config.infoMessage}</p>
      )}

      {/* Onboarding Link Display (for pre_qualified status) */}
      {config.showOnboardingLink && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
            <CheckCircle className="h-4 w-4" />
            Pre-qualified. Send them the investor onboarding form:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-0 rounded-lg border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
              {onboardingUrl}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {config.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {config.actions.map((action) => {
            const buttonVariant =
              action.variant === 'primary'
                ? 'default'
                : action.variant === 'destructive'
                ? 'destructive'
                : 'outline';

            switch (action.type) {
              case 'approve_kyc':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleApproveKyc}
                    disabled={isLoading}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'reject_kyc':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleRejectKyc}
                    disabled={isLoading}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'copy_onboarding_link':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleCopyOnboardingLink}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-1 h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        {action.label}
                      </>
                    )}
                  </Button>
                );

              case 'email_onboarding_link':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleEmailOnboardingLink}
                    disabled={isLoading}
                  >
                    <Send className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'send_account_invite':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleSendAccountInvite}
                    disabled={isLoading}
                  >
                    <Mail className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'approve_documents':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleApproveDocuments}
                    disabled={isLoading}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'reject_documents':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isLoading}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'convert_to_investor':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={() => setShowConvertForm(true)}
                    disabled={isLoading}
                  >
                    <DollarSign className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'send_reminder':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleSendReminder}
                    disabled={isLoading}
                  >
                    <Mail className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              case 'mark_not_eligible':
                return (
                  <Button
                    key={action.type}
                    variant={buttonVariant}
                    size="sm"
                    onClick={handleMarkNotEligible}
                    disabled={isLoading}
                  >
                    <Ban className="mr-1 h-4 w-4" />
                    {action.label}
                  </Button>
                );

              default:
                return null;
            }
          })}
        </div>
      )}

      {/* No Actions Available */}
      {config.actions.length === 0 && !config.infoMessage && (
        <p className="text-sm text-muted-foreground">No actions available for this status.</p>
      )}
    </div>
  );
}

