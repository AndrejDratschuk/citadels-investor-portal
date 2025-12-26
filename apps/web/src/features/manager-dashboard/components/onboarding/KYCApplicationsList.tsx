import { useState } from 'react';
import { Search, ClipboardCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { KYCApplication } from './types';
import { KYCApplicationRow } from './KYCApplicationRow';
import { KYCApplicationDetails } from './KYCApplicationDetails';
import { KYCApprovalActions } from './KYCApprovalActions';
import { isKycPendingReview, getKycDisplayName } from './kycHelpers';

interface KYCApplicationsListProps {
  applications: KYCApplication[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onSendOnboardingLink: (app: KYCApplication) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  onStatusFilterChange: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
}

export function KYCApplicationsList({
  applications,
  isLoading,
  onApprove,
  onReject,
  onSendOnboardingLink,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: KYCApplicationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    // Search filter
    const searchMatch =
      !searchQuery ||
      getKycDisplayName(app).toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let statusMatch = true;
    if (statusFilter === 'pending') {
      statusMatch = isKycPendingReview(app.status);
    } else if (statusFilter === 'approved') {
      statusMatch = app.status === 'pre_qualified';
    } else if (statusFilter === 'rejected') {
      statusMatch = app.status === 'not_eligible';
    }

    return searchMatch && statusMatch;
  });

  const toggleExpanded = (id: string): void => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onStatusFilterChange(filter)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                statusFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No KYC applications found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredApps.map((app) => (
              <div key={app.id}>
                <KYCApplicationRow
                  app={app}
                  isExpanded={expandedId === app.id}
                  onToggle={() => toggleExpanded(app.id)}
                />

                {/* Expanded Details */}
                {expandedId === app.id && (
                  <div className="px-4 pb-4 space-y-4 border-t bg-muted/20">
                    <KYCApplicationDetails app={app} />

                    {/* Actions */}
                    {app.status !== 'draft' && (
                      <div className="ml-10 pt-4 border-t">
                        <KYCApprovalActions
                          app={app}
                          onApprove={onApprove}
                          onReject={onReject}
                          onSendOnboardingLink={onSendOnboardingLink}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

