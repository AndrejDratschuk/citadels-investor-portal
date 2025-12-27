import { useState } from 'react';
import { Search, UserCheck, ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OnboardingApplication } from '@/lib/api/onboarding';
import { entityLabels, accreditationLabels } from './types';

interface InvestorApplicationsListProps {
  applications: OnboardingApplication[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  onStatusFilterChange: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
}

export function InvestorApplicationsList({
  applications,
  isLoading,
  onApprove,
  onReject,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: InvestorApplicationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    const searchMatch =
      !searchQuery ||
      `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase());

    let statusMatch = true;
    if (statusFilter !== 'all') {
      statusMatch = app.status === statusFilter;
    }

    return searchMatch && statusMatch;
  });

  const handleApprove = async (id: string): Promise<void> => {
    setActionLoading(id);
    await onApprove(id);
    setActionLoading(null);
  };

  const handleReject = async (id: string): Promise<void> => {
    if (!rejectReason.trim()) return;
    setActionLoading(id);
    await onReject(id, rejectReason);
    setActionLoading(null);
    setShowRejectInput(null);
    setRejectReason('');
  };

  const getStatusBadge = (status: OnboardingApplication['status']): { label: string; color: string } => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
      case 'approved':
        return { label: 'Approved', color: 'bg-green-100 text-green-700' };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-700' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700' };
    }
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
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No investor applications found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredApps.map((app) => {
              const isExpanded = expandedId === app.id;
              const statusInfo = getStatusBadge(app.status);

              return (
                <div key={app.id}>
                  {/* Row */}
                  <div
                    className={cn(
                      'flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors',
                      isExpanded && 'bg-muted/30'
                    )}
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <button className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {app.firstName?.[0]?.toUpperCase() || '?'}
                      {app.lastName?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                    </div>

                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-medium">{app.commitmentAmount ? formatCurrency(app.commitmentAmount) : '-'}</p>
                      <p className="text-xs text-muted-foreground">Commitment</p>
                    </div>

                    <div className="hidden md:block text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(app.submittedAt)}
                      </p>
                    </div>

                    <div>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          statusInfo.color
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t bg-muted/20">
                      <div className="ml-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                        <div>
                          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                            Contact
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>{app.email}</p>
                            {app.phone && <p>{app.phone}</p>}
                            {(app.city || app.state || app.country) && (
                              <p className="text-muted-foreground">
                                {[app.city, app.state, app.country].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {app.entityType && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                              Entity
                            </h4>
                            <div className="space-y-1 text-sm">
                              <p>{entityLabels[app.entityType] || app.entityType}</p>
                              {app.entityName && <p>{app.entityName}</p>}
                            </div>
                          </div>
                        )}

                        {(app.taxResidency || app.taxIdType) && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                              Tax Info
                            </h4>
                            <div className="space-y-1 text-sm">
                              {app.taxResidency && <p>{app.taxResidency}</p>}
                              {app.taxIdType && app.taxIdNumber && (
                                <p>
                                  {app.taxIdType.toUpperCase()}: ***-**-{app.taxIdNumber.slice(-4)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {app.accreditationType && (
                          <div>
                            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                              Accreditation
                            </h4>
                            <p className="text-sm">
                              {accreditationLabels[app.accreditationType] || app.accreditationType}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {app.status === 'pending' && (
                        <div className="ml-10 pt-4 border-t flex flex-wrap items-center gap-2">
                          {showRejectInput !== app.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(app.id);
                                }}
                                disabled={actionLoading === app.id}
                              >
                                {actionLoading === app.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowRejectInput(app.id);
                                }}
                                disabled={actionLoading === app.id}
                              >
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Input
                                placeholder="Reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-48"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(app.id)}
                                disabled={!rejectReason.trim() || actionLoading === app.id}
                              >
                                {actionLoading === app.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setShowRejectInput(null);
                                  setRejectReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
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
    </div>
  );
}

