import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Shield,
  FileText,
  RefreshCw,
  Copy,
  Check,
  ClipboardCheck,
  UserCheck,
  Loader2,
  Share2,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@flowveda/shared';
import { cn } from '@/lib/utils';
import { kycApi } from '@/lib/api/kyc';
import { 
  KYCApplication, 
  ACCREDITATION_OPTIONS,
  INVESTMENT_GOALS,
  LIKELIHOOD_OPTIONS,
  CONTACT_PREFERENCES,
  TIMELINE_OPTIONS,
} from '@/features/kyc/types';
import { useAuthStore } from '@/stores/authStore';
import { EmailComposeModal } from '../components/EmailComposeModal';

// Types for Investor Applications (Form 2)
interface InvestorApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  entityType: string;
  entityName?: string;
  taxResidency: string;
  taxIdType: string;
  taxIdLast4: string;
  accreditationType: string;
  commitmentAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

type TabType = 'kyc' | 'investor';

// Mock data for Investor Applications (Form 2)
const mockInvestorApplications: InvestorApplication[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    entityType: 'individual',
    taxResidency: 'United States',
    taxIdType: 'ssn',
    taxIdLast4: '1234',
    accreditationType: 'income',
    commitmentAmount: 250000,
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

// Helper to get accreditation label from ACCREDITATION_OPTIONS
const getAccreditationLabel = (id: string): string => {
  const option = ACCREDITATION_OPTIONS.find(opt => opt.id === id);
  return option?.label || id;
};

// Helper to get investment goal label
const getInvestmentGoalLabel = (value: string): string => {
  const goal = INVESTMENT_GOALS.find(g => g.value === value);
  return goal?.label || value;
};

// Helper to get likelihood label
const getLikelihoodLabel = (value: string): string => {
  const option = LIKELIHOOD_OPTIONS.find(o => o.value === value);
  return option?.label || value;
};

// Helper to get contact preference label
const getContactPreferenceLabel = (value: string): string => {
  const option = CONTACT_PREFERENCES.find(o => o.value === value);
  return option?.label || value;
};

// Helper to get timeline label
const getTimelineLabel = (value: string): string => {
  const option = TIMELINE_OPTIONS.find(o => o.value === value);
  return option?.label || value.replace(/_/g, ' ');
};

const entityLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  trust: 'Trust',
  llc: 'LLC',
  corporation: 'Corporation',
  hnw: 'High Net Worth',
  qp: 'Qualified Purchaser',
  ia: 'Institutional Investor',
  ria: 'RIA',
};

const investorTypeLabels: Record<string, string> = {
  hnw: 'High Net Worth',
  qp: 'Qualified Purchaser',
  ia: 'Institutional Investor',
  ria: 'RIA',
};

// Simple labels for Form 2 investor applications accreditation types
const accreditationLabels: Record<string, string> = {
  income: 'Income ($200k+ individual / $300k+ joint)',
  net_worth: 'Net Worth ($1M+ excluding primary residence)',
  professional: 'Licensed Professional',
  entity: 'Qualified Entity ($5M+ assets)',
};

function formatTimeAgo(dateString: string): string {
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

// Get the base URL for Form 2 links
function getForm2BaseUrl(): string {
  // Use the current origin for the invite link
  return window.location.origin;
}

export function OnboardingQueue() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('kyc');
  const [investorApplications, setInvestorApplications] = useState(mockInvestorApplications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [kycLinkCopied, setKycLinkCopied] = useState(false);
  const [emailModalApp, setEmailModalApp] = useState<KYCApplication | null>(null);

  // Fetch KYC applications
  const { data: kycApplications = [], isLoading: kycLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['kyc-applications'],
    queryFn: () => kycApi.getAll(),
  });

  // Approve KYC mutation
  const approveKycMutation = useMutation({
    mutationFn: (id: string) => kycApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
    onError: (error: Error) => {
      console.error('[Approve KYC] Error:', error);
      alert(`Failed to approve: ${error.message}`);
    },
  });

  // Reject KYC mutation
  const rejectKycMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => kycApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
      setRejectingId(null);
      setRejectionReason('');
    },
  });

  // Stats for KYC applications
  const kycPendingCount = kycApplications.filter((a) => 
    a.status === 'submitted' || a.status === 'meeting_scheduled' || a.status === 'meeting_complete'
  ).length;
  const kycApprovedCount = kycApplications.filter((a) => a.status === 'pre_qualified').length;
  const kycRejectedCount = kycApplications.filter((a) => a.status === 'not_eligible').length;

  // Stats for Investor Applications
  const investorPendingCount = investorApplications.filter((a) => a.status === 'pending').length;
  const investorApprovedCount = investorApplications.filter((a) => a.status === 'approved').length;
  const investorRejectedCount = investorApplications.filter((a) => a.status === 'rejected').length;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // KYC handlers
  const handleApproveKyc = (id: string) => {
    approveKycMutation.mutate(id);
  };

  const handleRejectKyc = (id: string) => {
    if (rejectingId === id && rejectionReason.trim()) {
      rejectKycMutation.mutate({ id, reason: rejectionReason });
    } else {
      setRejectingId(id);
    }
  };

  // Investor Application handlers
  const handleApproveInvestor = (id: string) => {
    setInvestorApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status: 'approved' as const } : app
      )
    );
  };

  const handleRejectInvestor = (id: string) => {
    if (rejectingId === id && rejectionReason.trim()) {
      setInvestorApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: 'rejected' as const } : app
        )
      );
      setRejectingId(null);
      setRejectionReason('');
    } else {
      setRejectingId(id);
    }
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectionReason('');
  };

  // Copy KYC form link to clipboard
  const copyKycLink = async () => {
    if (!user?.fundId) {
      alert('No fund ID found. Please contact support.');
      return;
    }
    
    const kycUrl = `${getForm2BaseUrl()}/kyc/${user.fundId}`;
    
    try {
      await navigator.clipboard.writeText(kycUrl);
      setKycLinkCopied(true);
      setTimeout(() => setKycLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Copy Form 2 link to clipboard
  const copyForm2Link = async (kycApp: KYCApplication) => {
    // TODO: Get actual fund invite code from fund settings
    const inviteCode = 'citadel-2024'; // Placeholder - should come from fund settings
    const form2Url = `${getForm2BaseUrl()}/onboard/${inviteCode}?kyc=${kycApp.id}`;
    
    try {
      await navigator.clipboard.writeText(form2Url);
      setCopiedId(kycApp.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate email data for Form 2
  const getForm2EmailData = (kycApp: KYCApplication) => {
    const inviteCode = 'citadel-2024'; // Placeholder - should come from fund settings
    const form2Url = `${getForm2BaseUrl()}/onboard/${inviteCode}?kyc=${kycApp.id}`;
    const investorName = getKycDisplayName(kycApp);
    const investorEmail = kycApp.investorCategory === 'entity' 
      ? kycApp.workEmail || kycApp.email 
      : kycApp.email;
    
    const subject = 'Complete Your Investor Application';
    const body = `Hi ${investorName.split(' ')[0] || 'there'},

Thank you for completing the pre-qualification form. We're pleased to inform you that you meet the requirements to proceed with the investment.

Please click the link below to complete your investor application:

${form2Url}

This secure form will allow you to provide the necessary information to finalize your investment. Your information from the pre-qualification form has been saved and will be pre-filled for your convenience.

If you have any questions, please don't hesitate to reach out.

Best regards,
The Investment Team`;

    return { email: investorEmail, name: investorName, subject, body };
  };

  const getKycDisplayName = (app: KYCApplication): string => {
    if (app.investorCategory === 'entity') {
      return app.entityLegalName || `${app.authorizedSignerFirstName || ''} ${app.authorizedSignerLastName || ''}`.trim() || app.email;
    }
    return `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.email;
  };

  const getKycStatusLabel = (status: KYCApplication['status']): { label: string; color: string } => {
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
  };

  const isKycPendingReview = (status: KYCApplication['status']): boolean => {
    return status === 'submitted' || status === 'meeting_scheduled' || status === 'meeting_complete';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding</h1>
          <p className="mt-1 text-muted-foreground">
            Review KYC pre-qualifications and investor applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyKycLink} disabled={!user?.fundId}>
            {kycLinkCopied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share KYC Form
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => activeTab === 'kyc' ? refetchKyc() : null}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('kyc')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'kyc'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <ClipboardCheck className="h-4 w-4" />
          KYC Pre-Qualification
          {kycPendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {kycPendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('investor')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'investor'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <UserCheck className="h-4 w-4" />
          Investor Applications
          {investorPendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {investorPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeTab === 'kyc' ? kycPendingCount : investorPendingCount}
              </p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeTab === 'kyc' ? kycApprovedCount : investorApprovedCount}
              </p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {activeTab === 'kyc' ? kycRejectedCount : investorRejectedCount}
              </p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Applications List */}
      {activeTab === 'kyc' && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">KYC Pre-Qualifications ({kycApplications.length})</h2>
          </div>

          {kycLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : kycApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No KYC applications yet</p>
              <p className="text-sm text-muted-foreground">
                Share your KYC form link with potential investors
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {kycApplications.map((app) => {
                const statusInfo = getKycStatusLabel(app.status);
                
                return (
                  <div key={app.id}>
                    {/* Application Row */}
                    <div
                      className={cn(
                        'flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors',
                        expandedId === app.id && 'bg-muted/30'
                      )}
                      onClick={() => toggleExpand(app.id)}
                    >
                      <button className="shrink-0">
                        {expandedId === app.id ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {(app.firstName?.[0] || app.authorizedSignerFirstName?.[0] || app.email[0]).toUpperCase()}
                        {(app.lastName?.[0] || app.authorizedSignerLastName?.[0] || '').toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {getKycDisplayName(app)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                      </div>

                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-medium capitalize">
                          {app.investorCategory === 'entity' ? 'Entity' : 'Individual'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {investorTypeLabels[app.investorType] || app.investorType}
                        </p>
                      </div>

                      <div className="hidden md:block text-right">
                        <p className="text-sm text-muted-foreground">{formatTimeAgo(app.createdAt)}</p>
                      </div>

                      <div>
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === app.id && (
                      <div className="border-t bg-muted/20 px-4 py-6">
                        <div className="ml-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {/* Contact Info */}
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                              Contact Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {app.investorCategory === 'entity' ? app.workEmail || app.email : app.email}
                              </div>
                              {(app.phone || app.workPhone) && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {app.investorCategory === 'entity' ? app.workPhone : app.phone}
                                </div>
                              )}
                              {(app.city || app.principalOfficeCity) && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <span>
                                    {app.investorCategory === 'entity' 
                                      ? `${app.principalOfficeCity || ''}, ${app.principalOfficeState || ''}, ${app.principalOfficeCountry || ''}`
                                      : `${app.city || ''}, ${app.state || ''}, ${app.country || ''}`
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Investor Type */}
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                              Investor Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {app.investorCategory === 'entity' ? 'Entity' : 'Individual'} - {investorTypeLabels[app.investorType] || app.investorType}
                              </div>
                              {app.entityLegalName && (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {app.entityLegalName}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Accreditation */}
                          <div className="lg:col-span-2">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                              Accreditation Basis
                            </h4>
                            <div className="space-y-2 text-sm">
                              {app.accreditationBases && app.accreditationBases.length > 0 ? (
                                app.accreditationBases.map((basis) => (
                                  <div key={basis} className="flex items-start gap-2">
                                    <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-xs">{getAccreditationLabel(basis)}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground">No accreditation selected</p>
                              )}
                            </div>
                          </div>

                          {/* Investment Intent */}
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                              Investment Intent
                            </h4>
                            <div className="space-y-2 text-sm">
                              {app.indicativeCommitment ? (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  {formatCurrency(app.indicativeCommitment)} indicative
                                </div>
                              ) : (
                                <p className="text-muted-foreground">Not specified</p>
                              )}
                              {app.timeline && (
                                <p>
                                  <span className="text-muted-foreground">Timeline:</span> {getTimelineLabel(app.timeline)}
                                </p>
                              )}
                              {app.likelihood && (
                                <p>
                                  <span className="text-muted-foreground">Likelihood:</span> {getLikelihoodLabel(app.likelihood)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Investment Goals */}
                          {app.investmentGoals && app.investmentGoals.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                                Investment Goals
                              </h4>
                              <div className="space-y-1 text-sm">
                                {app.investmentGoals.map((goal) => (
                                  <p key={goal}>• {getInvestmentGoalLabel(goal)}</p>
                                ))}
                                {app.investmentGoalsOther && (
                                  <p className="text-muted-foreground italic">Other: {app.investmentGoalsOther}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Questions for Manager */}
                          {app.questionsForManager && (
                            <div className="lg:col-span-2">
                              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                                Questions for Manager
                              </h4>
                              <p className="text-sm bg-gray-50 rounded-lg p-3 italic">
                                "{app.questionsForManager}"
                              </p>
                            </div>
                          )}

                          {/* Contact Preferences */}
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                              Contact Preferences
                            </h4>
                            <div className="space-y-2 text-sm">
                              {app.preferredContact && (
                                <p>
                                  <span className="text-muted-foreground">Preferred:</span> {getContactPreferenceLabel(app.preferredContact)}
                                </p>
                              )}
                              <p>
                                <span className="text-muted-foreground">Consent:</span>{' '}
                                {app.consentGiven ? (
                                  <span className="text-green-600">Given ✓</span>
                                ) : (
                                  <span className="text-red-600">Not given</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Entity Authorized Signer (if entity) */}
                          {app.investorCategory === 'entity' && app.authorizedSignerTitle && (
                            <div>
                              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                                Authorized Signer
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p>{app.authorizedSignerFirstName} {app.authorizedSignerLastName}</p>
                                <p className="text-muted-foreground">{app.authorizedSignerTitle}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {isKycPendingReview(app.status) && (
                          <div className="ml-10 mt-6 pt-4 border-t">
                            {rejectingId === app.id ? (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Rejection Reason</p>
                                <Input
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Enter reason for rejection..."
                                  className="max-w-md"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRejectKyc(app.id)}
                                    disabled={!rejectionReason.trim() || rejectKycMutation.isPending}
                                  >
                                    {rejectKycMutation.isPending ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    Confirm Rejection
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={cancelReject}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveKyc(app.id)}
                                  disabled={approveKycMutation.isPending}
                                >
                                  {approveKycMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectKyc(app.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Approved - Show Form 2 Link */}
                        {app.status === 'pre_qualified' && (
                          <div className="ml-10 mt-6 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                              <CheckCircle2 className="h-4 w-4" />
                              Pre-qualified. Send them the investor application form:
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex-1 min-w-0 rounded-lg border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
                                {`${getForm2BaseUrl()}/onboard/citadel-2024?kyc=${app.id}`}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyForm2Link(app);
                                  }}
                                >
                                  {copiedId === app.id ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailModalApp(app);
                                  }}
                                >
                                  <Send className="mr-2 h-4 w-4" />
                                  Email Link
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {app.status === 'not_eligible' && (
                          <div className="ml-10 mt-6 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <XCircle className="h-4 w-4" />
                              Application rejected - not eligible.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Investor Applications List (Form 2) */}
      {activeTab === 'investor' && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Investor Applications ({investorApplications.length})</h2>
          </div>

          {investorApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No investor applications yet</p>
              <p className="text-sm text-muted-foreground">
                Approved KYC applicants will receive the investor application form
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {investorApplications.map((app) => (
                <div key={app.id}>
                  {/* Application Row */}
                  <div
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors',
                      expandedId === `inv-${app.id}` && 'bg-muted/30'
                    )}
                    onClick={() => toggleExpand(`inv-${app.id}`)}
                  >
                    <button className="shrink-0">
                      {expandedId === `inv-${app.id}` ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {app.firstName[0]}{app.lastName[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {app.firstName} {app.lastName}
                        {app.entityName && (
                          <span className="text-muted-foreground font-normal">
                            {' '}({app.entityName})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="font-medium">{formatCurrency(app.commitmentAmount)}</p>
                      <p className="text-xs text-muted-foreground">Commitment</p>
                    </div>

                    <div className="hidden md:block text-right">
                      <p className="text-sm text-muted-foreground">{formatTimeAgo(app.submittedAt)}</p>
                    </div>

                    <div>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          app.status === 'pending' && 'bg-amber-100 text-amber-700',
                          app.status === 'approved' && 'bg-green-100 text-green-700',
                          app.status === 'rejected' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {app.status === 'pending' ? 'Pending' : app.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === `inv-${app.id}` && (
                    <div className="border-t bg-muted/20 px-4 py-6">
                      <div className="ml-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Contact Info */}
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                            Contact Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {app.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {app.phone}
                            </div>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{app.address}, {app.city}, {app.state}, {app.country}</span>
                            </div>
                          </div>
                        </div>

                        {/* Entity Info */}
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                            Entity Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {entityLabels[app.entityType] || app.entityType}
                            </div>
                            {app.entityName && (
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                {app.entityName}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tax Info */}
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                            Tax Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-muted-foreground">Residency:</span>{' '}
                              {app.taxResidency}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Tax ID:</span>{' '}
                              {app.taxIdType.toUpperCase()} ••••{app.taxIdLast4}
                            </p>
                          </div>
                        </div>

                        {/* Investment Info */}
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                            Investment Details
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {formatCurrency(app.commitmentAmount)}
                            </div>
                            <div className="flex items-start gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{accreditationLabels[app.accreditationType] || app.accreditationType}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {app.status === 'pending' && (
                        <div className="ml-10 mt-6 pt-4 border-t">
                          {rejectingId === `inv-${app.id}` ? (
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Rejection Reason</p>
                              <Input
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason for rejection..."
                                className="max-w-md"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRejectInvestor(app.id)}
                                  disabled={!rejectionReason.trim()}
                                >
                                  Confirm Rejection
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelReject}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveInvestor(app.id)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve & Send Contract
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingId(`inv-${app.id}`)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {app.status === 'approved' && (
                        <div className="ml-10 mt-6 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Application approved. Contract sent via DocuSign.
                          </div>
                        </div>
                      )}

                      {app.status === 'rejected' && (
                        <div className="ml-10 mt-6 pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            Application rejected.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Compose Modal */}
      {emailModalApp && (
        <EmailComposeModal
          isOpen={!!emailModalApp}
          onClose={() => setEmailModalApp(null)}
          recipientEmail={
            emailModalApp.investorCategory === 'entity'
              ? emailModalApp.workEmail || emailModalApp.email
              : emailModalApp.email
          }
          defaultSubject={getForm2EmailData(emailModalApp).subject}
          defaultBody={getForm2EmailData(emailModalApp).body}
        />
      )}
    </div>
  );
}
