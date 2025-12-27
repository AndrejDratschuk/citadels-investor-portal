/**
 * ProspectDetailModal
 * Modal for viewing prospect details and timeline
 * Actions are delegated to ProspectActions component
 */

import {
  X,
  Mail,
  Phone,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { ProspectStatusBadge } from './ProspectStatusBadge';
import { ProspectActions } from './ProspectActions';
import { requiresManagerAction } from '@flowveda/shared';
import type { Prospect, ProspectStatus } from '@flowveda/shared';

interface ProspectDetailModalProps {
  prospect: Prospect;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function ProspectDetailModal({
  prospect,
  open,
  onClose,
  onRefresh,
}: ProspectDetailModalProps): JSX.Element | null {
  if (!open) return null;

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayName = (): string => {
    if (prospect.firstName && prospect.lastName) {
      return `${prospect.firstName} ${prospect.lastName}`;
    }
    if (prospect.firstName) return prospect.firstName;
    if (prospect.entityLegalName) return prospect.entityLegalName;
    return prospect.email;
  };

  const needsAction = requiresManagerAction(prospect.status as ProspectStatus);

  // Timeline events
  const timeline = [
    { label: 'Created', date: prospect.createdAt, icon: Clock },
    prospect.status !== 'kyc_sent' && { label: 'KYC Submitted', date: prospect.createdAt, icon: FileText },
    prospect.meetingScheduledAt && { label: 'Meeting Scheduled', date: prospect.meetingScheduledAt, icon: Calendar },
    prospect.meetingCompletedAt && { label: 'Meeting Completed', date: prospect.meetingCompletedAt, icon: CheckCircle },
    prospect.onboardingStartedAt && { label: 'Onboarding Started', date: prospect.onboardingStartedAt, icon: Clock },
    prospect.onboardingSubmittedAt && { label: 'Onboarding Submitted', date: prospect.onboardingSubmittedAt, icon: FileText },
    prospect.documentsApprovedAt && { label: 'Documents Approved', date: prospect.documentsApprovedAt, icon: CheckCircle },
    prospect.documentsRejectedAt && { label: 'Documents Rejected', date: prospect.documentsRejectedAt, icon: XCircle },
    prospect.docusignSentAt && { label: 'DocuSign Sent', date: prospect.docusignSentAt, icon: Send },
    prospect.docusignSignedAt && { label: 'DocuSign Signed', date: prospect.docusignSignedAt, icon: CheckCircle },
    prospect.convertedAt && { label: 'Converted to Investor', date: prospect.convertedAt, icon: CheckCircle },
  ].filter(Boolean) as Array<{ label: string; date: string; icon: typeof Clock }>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 m-4 w-full max-w-2xl rounded-lg bg-background shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <div>
            <h2 className="text-lg font-semibold">{getDisplayName()}</h2>
            <p className="text-sm text-muted-foreground">{prospect.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <ProspectStatusBadge status={prospect.status} size="md" />
            <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Required Banner */}
          {needsAction && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-800">
                Action Required: Review and take next steps for this prospect
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{prospect.email}</span>
            </div>
            {prospect.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{prospect.phone}</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{prospect.investorCategory || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="font-medium capitalize">{prospect.source?.replace('_', ' ') || '-'}</p>
            </div>
            {prospect.indicativeCommitment && (
              <div>
                <p className="text-xs text-muted-foreground">Indicative Commitment</p>
                <p className="font-medium">${prospect.indicativeCommitment.toLocaleString()}</p>
              </div>
            )}
            {prospect.timeline && (
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="font-medium capitalize">{prospect.timeline.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {/* Entity Info (if applicable) */}
          {prospect.entityLegalName && (
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Entity Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Legal Name</p>
                  <p>{prospect.entityLegalName}</p>
                </div>
                {prospect.countryOfFormation && (
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p>{prospect.countryOfFormation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {prospect.notes && (
            <div className="rounded-lg border p-4">
              <h3 className="font-medium mb-2">Internal Notes</h3>
              <p className="text-sm text-muted-foreground">{prospect.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-4">Timeline</h3>
            <div className="space-y-3">
              {timeline.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-1.5">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions - delegated to ProspectActions component */}
          <ProspectActions prospect={prospect} onRefresh={onRefresh} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
