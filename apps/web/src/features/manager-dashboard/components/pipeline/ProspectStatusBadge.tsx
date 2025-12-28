/**
 * ProspectStatusBadge
 * Display badge for prospect status
 */

import { getStatusLabel } from '@altsui/shared';
import type { ProspectStatus } from '@altsui/shared';

interface ProspectStatusBadgeProps {
  status: ProspectStatus | string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  kyc_sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
  kyc_submitted: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  pre_qualified: { bg: 'bg-violet-100', text: 'text-violet-700' },
  not_eligible: { bg: 'bg-red-100', text: 'text-red-700' },
  meeting_scheduled: { bg: 'bg-purple-100', text: 'text-purple-700' },
  meeting_complete: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  account_invite_sent: { bg: 'bg-amber-100', text: 'text-amber-700' },
  account_created: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  onboarding_submitted: { bg: 'bg-lime-100', text: 'text-lime-700' },
  documents_pending: { bg: 'bg-orange-100', text: 'text-orange-700' },
  documents_approved: { bg: 'bg-teal-100', text: 'text-teal-700' },
  documents_rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  docusign_sent: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  docusign_signed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  converted: { bg: 'bg-green-100', text: 'text-green-700' },
  // Legacy statuses
  submitted: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export function ProspectStatusBadge({
  status,
  size = 'sm',
}: ProspectStatusBadgeProps): JSX.Element {
  const styles = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  const label = getStatusLabel(status as ProspectStatus) || status;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${styles.bg} ${styles.text} ${sizeClasses}`}
    >
      {label}
    </span>
  );
}

