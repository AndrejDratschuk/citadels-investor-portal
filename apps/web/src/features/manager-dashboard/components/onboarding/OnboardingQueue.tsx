import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kycApi } from '@/lib/api/kyc';
import { onboardingApi, OnboardingApplication } from '@/lib/api/onboarding';
import { communicationsApi } from '@/lib/api/communications';
import { useAuthStore } from '@/stores/authStore';

import { OnboardingTabs } from './OnboardingTabs';
import { OnboardingStats } from './OnboardingStats';
import { KYCApplicationsList } from './KYCApplicationsList';
import { InvestorApplicationsList } from './InvestorApplicationsList';
import { OnboardingTabType, KYCApplication, OnboardingStats as StatsType } from './types';
import { isKycPendingReview, getOnboardingBaseUrl, getKycDisplayName } from './kycHelpers';

export function OnboardingQueue() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // UI State
  const [activeTab, setActiveTab] = useState<OnboardingTabType>('kyc');
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [investorSearchQuery, setInvestorSearchQuery] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [investorStatusFilter, setInvestorStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [kycLinkCopied, setKycLinkCopied] = useState(false);

  // Data queries
  const { data: kycApplications = [], isLoading: kycLoading, refetch: refetchKyc } = useQuery({
    queryKey: ['kyc-applications'],
    queryFn: () => kycApi.getAll(),
  });

  const { data: investorApplications = [], isLoading: investorLoading, refetch: refetchInvestor } = useQuery({
    queryKey: ['onboarding-applications'],
    queryFn: () => onboardingApi.getAll(),
  });

  // Copy KYC form link to clipboard
  const copyKycLink = useCallback(async () => {
    if (!user?.fundId) {
      alert('No fund ID found. Please contact support.');
      return;
    }
    
    const kycUrl = `${getOnboardingBaseUrl()}/kyc/${user.fundId}`;
    
    try {
      await navigator.clipboard.writeText(kycUrl);
      setKycLinkCopied(true);
      setTimeout(() => setKycLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [user?.fundId]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (activeTab === 'kyc') {
      refetchKyc();
    } else {
      refetchInvestor();
    }
  }, [activeTab, refetchKyc, refetchInvestor]);

  // Mutations
  const approveKycMutation = useMutation({
    mutationFn: (id: string) => kycApi.updateStatus(id, 'pre_qualified'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      kycApi.updateStatus(id, 'not_eligible', reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-applications'] });
    },
  });

  const approveInvestorMutation = useMutation({
    mutationFn: (id: string) => onboardingApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
  });

  const rejectInvestorMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      onboardingApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-applications'] });
    },
  });

  // Handlers
  const handleApproveKyc = useCallback(async (id: string): Promise<void> => {
    await approveKycMutation.mutateAsync(id);
  }, [approveKycMutation]);

  const handleRejectKyc = useCallback(async (id: string, reason: string): Promise<void> => {
    await rejectKycMutation.mutateAsync({ id, reason });
  }, [rejectKycMutation]);

  const handleApproveInvestor = useCallback(async (id: string): Promise<void> => {
    await approveInvestorMutation.mutateAsync(id);
  }, [approveInvestorMutation]);

  const handleRejectInvestor = useCallback(async (id: string, reason: string): Promise<void> => {
    await rejectInvestorMutation.mutateAsync({ id, reason });
  }, [rejectInvestorMutation]);

  const handleSendOnboardingLink = useCallback(async (app: KYCApplication): Promise<void> => {
    // Use fundCode if available, otherwise fallback to fundId
    const fundIdentifier = app.fundCode || app.fundId;
    const onboardingUrl = `${getOnboardingBaseUrl()}/onboard/${fundIdentifier}?kyc=${app.id}`;
    
    try {
      await communicationsApi.send({
        investorIds: [], // KYC applicant doesn't have investor ID yet
        subject: 'Complete Your Investor Application',
        body: `
          <p>Dear ${getKycDisplayName(app)},</p>
          <p>Thank you for completing your pre-qualification. Please complete your investor onboarding by clicking the link below:</p>
          <p><a href="${onboardingUrl}">Complete Onboarding</a></p>
        `,
        recipientEmails: [app.email],
      });

      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(onboardingUrl);
    } catch (error) {
      console.error('Failed to send onboarding link:', error);
      // Fallback: just copy to clipboard
      await navigator.clipboard.writeText(onboardingUrl);
    }
  }, []);

  // Compute stats
  const kycStats: StatsType = {
    pending: kycApplications.filter((app: KYCApplication) => isKycPendingReview(app.status)).length,
    approved: kycApplications.filter((app: KYCApplication) => app.status === 'pre_qualified').length,
    rejected: kycApplications.filter((app: KYCApplication) => app.status === 'not_eligible').length,
  };

  const investorStats: StatsType = {
    pending: investorApplications.filter((app: OnboardingApplication) => app.status === 'pending').length,
    approved: investorApplications.filter((app: OnboardingApplication) => app.status === 'approved').length,
    rejected: investorApplications.filter((app: OnboardingApplication) => app.status === 'rejected').length,
  };

  const currentStats = activeTab === 'kyc' ? kycStats : investorStats;

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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <OnboardingStats stats={currentStats} />

      {/* Tabs */}
      <OnboardingTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        kycPendingCount={kycStats.pending}
        investorPendingCount={investorStats.pending}
      />

      {/* Content */}
      {activeTab === 'kyc' ? (
        <KYCApplicationsList
          applications={kycApplications}
          isLoading={kycLoading}
          onApprove={handleApproveKyc}
          onReject={handleRejectKyc}
          onSendOnboardingLink={handleSendOnboardingLink}
          searchQuery={kycSearchQuery}
          onSearchChange={setKycSearchQuery}
          statusFilter={kycStatusFilter}
          onStatusFilterChange={setKycStatusFilter}
        />
      ) : (
        <InvestorApplicationsList
          applications={investorApplications}
          isLoading={investorLoading}
          onApprove={handleApproveInvestor}
          onReject={handleRejectInvestor}
          searchQuery={investorSearchQuery}
          onSearchChange={setInvestorSearchQuery}
          statusFilter={investorStatusFilter}
          onStatusFilterChange={setInvestorStatusFilter}
        />
      )}
    </div>
  );
}

