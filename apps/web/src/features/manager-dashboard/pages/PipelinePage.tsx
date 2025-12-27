/**
 * PipelinePage
 * Main page for managing prospect pipeline
 */

import { useState } from 'react';
import { Mail, Download, Loader2, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProspects, usePipelineStats } from '../hooks/useProspects';
import { PipelineMetricsBar } from '../components/pipeline/PipelineMetricsBar';
import { ProspectTable } from '../components/pipeline/ProspectTable';
import { SendKYCModal } from '../components/pipeline/SendKYCModal';
import { ProspectDetailModal } from '../components/pipeline/ProspectDetailModal';
import type { Prospect, ProspectStatus } from '@flowveda/shared';

const STATUS_GROUPS = {
  all: 'All',
  kyc: 'KYC',
  meeting: 'Meeting',
  onboarding: 'Onboarding',
  documents: 'Documents',
  signing: 'Signing',
  converted: 'Converted',
  rejected: 'Rejected',
} as const;

type StatusGroup = keyof typeof STATUS_GROUPS;

const STATUS_TO_GROUP: Record<string, StatusGroup> = {
  kyc_sent: 'kyc',
  kyc_submitted: 'kyc',
  pre_qualified: 'kyc',
  meeting_scheduled: 'meeting',
  meeting_complete: 'meeting',
  account_invite_sent: 'onboarding',
  account_created: 'onboarding',
  onboarding_submitted: 'onboarding',
  documents_pending: 'documents',
  documents_approved: 'documents',
  documents_rejected: 'documents',
  docusign_sent: 'signing',
  docusign_signed: 'signing',
  converted: 'converted',
  not_eligible: 'rejected',
};

export function PipelinePage(): JSX.Element {
  const [isKYCModalOpen, setKYCModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: prospects = [], isLoading, error, refetch } = useProspects();
  const { data: stats } = usePipelineStats();

  // Filter prospects
  const filteredProspects = prospects.filter((prospect) => {
    // Status group filter
    if (statusFilter !== 'all') {
      const prospectGroup = STATUS_TO_GROUP[prospect.status] || 'all';
      if (prospectGroup !== statusFilter) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${prospect.firstName || ''} ${prospect.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        prospect.email.toLowerCase().includes(query) ||
        (prospect.entityLegalName?.toLowerCase().includes(query) ?? false)
      );
    }

    return true;
  });

  // Count by group
  const groupCounts: Record<StatusGroup, number> = {
    all: prospects.length,
    kyc: prospects.filter((p) => ['kyc_sent', 'kyc_submitted', 'pre_qualified'].includes(p.status)).length,
    meeting: prospects.filter((p) => ['meeting_scheduled', 'meeting_complete'].includes(p.status)).length,
    onboarding: prospects.filter((p) => ['account_invite_sent', 'account_created', 'onboarding_submitted'].includes(p.status)).length,
    documents: prospects.filter((p) => ['documents_pending', 'documents_approved', 'documents_rejected'].includes(p.status)).length,
    signing: prospects.filter((p) => ['docusign_sent', 'docusign_signed'].includes(p.status)).length,
    converted: prospects.filter((p) => p.status === 'converted').length,
    rejected: prospects.filter((p) => p.status === 'not_eligible').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Failed to Load Pipeline</h2>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="mt-1 text-muted-foreground">
            Track prospects from KYC through to investor conversion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setKYCModalOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send KYC Form
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      {stats && <PipelineMetricsBar stats={stats} />}

      {/* Status Group Filter */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(STATUS_GROUPS) as StatusGroup[]).map((group) => (
          <button
            key={group}
            onClick={() => setStatusFilter(group)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === group
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {STATUS_GROUPS[group]}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
              {groupCounts[group]}
            </span>
          </button>
        ))}
      </div>

      {/* Prospect Table */}
      <ProspectTable
        prospects={filteredProspects}
        onSearch={setSearchQuery}
        onSelectProspect={setSelectedProspect}
        onRefresh={refetch}
      />

      {/* Send KYC Modal */}
      <SendKYCModal
        open={isKYCModalOpen}
        onClose={() => setKYCModalOpen(false)}
        onSuccess={() => {
          setKYCModalOpen(false);
          refetch();
        }}
      />

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          open={!!selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onRefresh={refetch}
        />
      )}
    </div>
  );
}

