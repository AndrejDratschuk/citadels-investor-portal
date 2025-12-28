/**
 * ProspectTable
 * Table component for displaying prospects
 */

import { useState } from 'react';
import {
  Search,
  MoreHorizontal,
  Mail,
  Eye,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProspectStatusBadge } from './ProspectStatusBadge';
import { useSendReminder, useUpdateProspectStatus } from '../../hooks/useProspects';
import type { Prospect } from '@altsui/shared';

interface ProspectTableProps {
  prospects: Prospect[];
  onSearch: (query: string) => void;
  onSelectProspect: (prospect: Prospect) => void;
  onRefresh: () => void;
}

export function ProspectTable({
  prospects,
  onSearch,
  onSelectProspect,
  onRefresh,
}: ProspectTableProps): JSX.Element {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const sendReminderMutation = useSendReminder();
  const updateStatusMutation = useUpdateProspectStatus();

  const handleSendReminder = async (prospect: Prospect, type: 'kyc' | 'onboarding') => {
    try {
      await sendReminderMutation.mutateAsync({ id: prospect.id, type });
      alert('Reminder sent successfully!');
    } catch (error: any) {
      alert(`Failed to send reminder: ${error.message}`);
    }
  };

  const handleMarkNotEligible = async (prospect: Prospect) => {
    if (!confirm('Are you sure you want to mark this prospect as not eligible?')) {
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({
        id: prospect.id,
        input: { status: 'not_eligible' },
      });
      onRefresh();
    } catch (error: any) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDisplayName = (prospect: Prospect): string => {
    if (prospect.firstName && prospect.lastName) {
      return `${prospect.firstName} ${prospect.lastName}`;
    }
    if (prospect.firstName) return prospect.firstName;
    if (prospect.entityLegalName) return prospect.entityLegalName;
    return prospect.email;
  };

  const canSendKYCReminder = (status: string): boolean => status === 'kyc_sent';
  const canSendOnboardingReminder = (status: string): boolean => status === 'account_created';

  return (
    <div className="rounded-lg border bg-card">
      {/* Search Header */}
      <div className="flex items-center gap-4 border-b p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prospects..."
            className="w-full rounded-md border bg-background py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {prospects.length} prospect{prospects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-sm">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Name</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Source</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Created</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No prospects found. Send a KYC form to add a new prospect.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectProspect(prospect)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{getDisplayName(prospect)}</p>
                      {prospect.entityLegalName && prospect.firstName && (
                        <p className="text-xs text-muted-foreground">{prospect.entityLegalName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {prospect.email}
                  </td>
                  <td className="px-4 py-3">
                    <ProspectStatusBadge status={prospect.status} />
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-muted-foreground">
                    {prospect.source?.replace('_', ' ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(prospect.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedRow(expandedRow === prospect.id ? null : prospect.id)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {expandedRow === prospect.id && (
                        <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border bg-popover shadow-lg">
                          <div className="py-1">
                            <button
                              className="flex w-full items-center px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => {
                                setExpandedRow(null);
                                onSelectProspect(prospect);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </button>

                            {canSendKYCReminder(prospect.status) && (
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                  setExpandedRow(null);
                                  handleSendReminder(prospect, 'kyc');
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send KYC Reminder
                              </button>
                            )}

                            {canSendOnboardingReminder(prospect.status) && (
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                  setExpandedRow(null);
                                  handleSendReminder(prospect, 'onboarding');
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Send Onboarding Reminder
                              </button>
                            )}

                            {prospect.status !== 'not_eligible' && prospect.status !== 'converted' && (
                              <button
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-muted"
                                onClick={() => {
                                  setExpandedRow(null);
                                  handleMarkNotEligible(prospect);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark Not Eligible
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

