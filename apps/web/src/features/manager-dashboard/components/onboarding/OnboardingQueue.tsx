import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '@/lib/api/kyc';
import { onboardingApi, OnboardingApplication } from '@/lib/api/onboarding';
import { communicationsApi } from '@/lib/api/communications';

import { OnboardingTabs } from './OnboardingTabs';
import { OnboardingStats } from './OnboardingStats';
import { KYCApplicationsList } from './KYCApplicationsList';
import { InvestorApplicationsList } from './InvestorApplicationsList';
import { OnboardingTabType, KYCApplication, OnboardingStats as StatsType } from './types';
import { isKycPendingReview, getForm2BaseUrl, getKycDisplayName } from './kycHelpers';

export function OnboardingQueue() {
  const queryClient = useQueryClient();

  // UI State
  const [activeTab, setActiveTab] = useState<OnboardingTabType>('kyc');
  const [kycSearchQuery, setKycSearchQuery] = useState('');
  const [investorSearchQuery, setInvestorSearchQuery] = useState('');
  const [kycStatusFilter, setKycStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [investorStatusFilter, setInvestorStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Data queries
  const { data: kycApplications = [], isLoading: kycLoading } = useQuery({
    queryKey: ['kyc-applications'],
    queryFn: () => kycApi.getAll(),
  });

  const { data: investorApplications = [], isLoading: investorLoading } = useQuery({
    queryKey: ['onboarding-applications'],
    queryFn: () => onboardingApi.getAll(),
  });

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

  const handleSendForm2 = useCallback(async (app: KYCApplication): Promise<void> => {
    // Use fundCode if available, otherwise fallback to fundId
    const fundIdentifier = app.fundCode || app.fundId;
    const form2Url = `${getForm2BaseUrl()}/onboard/${fundIdentifier}?kyc=${app.id}`;
    
    try {
      await communicationsApi.send({
        investorIds: [], // KYC applicant doesn't have investor ID yet
        subject: 'Complete Your Investor Application',
        body: `
          <p>Dear ${getKycDisplayName(app)},</p>
          <p>Thank you for completing your pre-qualification. Please complete your investor application by clicking the link below:</p>
          <p><a href="${form2Url}">Complete Application</a></p>
        `,
        recipientEmails: [app.email],
      });

      // Copy to clipboard as fallback
      await navigator.clipboard.writeText(form2Url);
    } catch (error) {
      console.error('Failed to send Form 2 link:', error);
      // Fallback: just copy to clipboard
      await navigator.clipboard.writeText(form2Url);
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
      <div>
        <h1 className="text-3xl font-bold">Onboarding Queue</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve investor applications
        </p>
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
          onSendForm2={handleSendForm2}
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

