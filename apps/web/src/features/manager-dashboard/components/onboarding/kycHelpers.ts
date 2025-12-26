import {
  ACCREDITATION_OPTIONS,
  INVESTMENT_GOALS,
  LIKELIHOOD_OPTIONS,
  CONTACT_PREFERENCES,
  TIMELINE_OPTIONS,
} from '@/features/kyc/types';
import { KYCApplication } from './types';

export function getAccreditationLabel(id: string): string {
  const option = ACCREDITATION_OPTIONS.find((opt) => opt.id === id);
  return option?.label || id;
}

export function getInvestmentGoalLabel(value: string): string {
  const goal = INVESTMENT_GOALS.find((g) => g.value === value);
  return goal?.label || value;
}

export function getLikelihoodLabel(value: string): string {
  const option = LIKELIHOOD_OPTIONS.find((o) => o.value === value);
  return option?.label || value;
}

export function getContactPreferenceLabel(value: string): string {
  const option = CONTACT_PREFERENCES.find((o) => o.value === value);
  return option?.label || value;
}

export function getTimelineLabel(value: string): string {
  const option = TIMELINE_OPTIONS.find((o) => o.value === value);
  return option?.label || value.replace(/_/g, ' ');
}

export function getKycDisplayName(app: KYCApplication): string {
  if (app.investorCategory === 'entity') {
    return (
      app.entityLegalName ||
      `${app.authorizedSignerFirstName || ''} ${app.authorizedSignerLastName || ''}`.trim() ||
      app.email
    );
  }
  return `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.email;
}

export function getKycStatusLabel(status: KYCApplication['status']): { label: string; color: string } {
  switch (status) {
    case 'draft':
      return { label: 'Draft', color: 'bg-gray-100 text-gray-700' };
    case 'submitted':
      return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
    case 'pre_qualified':
      return { label: 'Approved', color: 'bg-green-100 text-green-700' };
    case 'not_eligible':
      return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
    case 'meeting_scheduled':
      return { label: 'Meeting Scheduled', color: 'bg-blue-100 text-blue-700' };
    case 'meeting_complete':
      return { label: 'Meeting Complete', color: 'bg-purple-100 text-purple-700' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
}

export function isKycPendingReview(status: KYCApplication['status']): boolean {
  return status === 'submitted' || status === 'meeting_scheduled' || status === 'meeting_complete';
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function getOnboardingBaseUrl(): string {
  return window.location.origin;
}

