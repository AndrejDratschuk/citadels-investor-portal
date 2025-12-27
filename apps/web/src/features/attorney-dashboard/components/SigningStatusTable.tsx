import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SigningStatusBadge, SigningStatus } from './SigningStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Send, Bell, Eye } from 'lucide-react';

export interface SigningRecord {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  investorId: string;
  investorName: string;
  investorEmail: string;
  status: SigningStatus;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  declinedAt?: string;
  reminderCount: number;
  lastReminderAt?: string;
}

interface SigningStatusTableProps {
  records: SigningRecord[];
  onView?: (id: string) => void;
  onResend?: (id: string) => void;
  onRemind?: (id: string) => void;
  className?: string;
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SigningStatusTable({
  records,
  onView,
  onResend,
  onRemind,
  className,
}: SigningStatusTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRecords = records.filter((record) => {
    const matchesSearch = 
      record.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.investorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const pendingCount = records.filter((r) => r.status === 'sent' || r.status === 'viewed').length;
  const signedCount = records.filter((r) => r.status === 'signed').length;
  const declinedCount = records.filter((r) => r.status === 'declined').length;

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-72"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="not_sent">Not Sent</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="signed">Signed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            <strong>{pendingCount}</strong> pending
          </span>
          <span className="text-emerald-600">
            <strong>{signedCount}</strong> signed
          </span>
          <span className="text-red-600">
            <strong>{declinedCount}</strong> declined
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Document
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Investor
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Sent
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Last Activity
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{record.documentName}</p>
                  <p className="text-xs text-muted-foreground">{record.documentType}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{record.investorName}</p>
                  <p className="text-xs text-muted-foreground">{record.investorEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <SigningStatusBadge status={record.status} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(record.sentAt)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {record.signedAt ? (
                    <span className="text-emerald-600">
                      Signed {formatDateTime(record.signedAt)}
                    </span>
                  ) : record.declinedAt ? (
                    <span className="text-red-600">
                      Declined {formatDateTime(record.declinedAt)}
                    </span>
                  ) : record.viewedAt ? (
                    <span>Viewed {formatDateTime(record.viewedAt)}</span>
                  ) : record.sentAt ? (
                    <span>Sent {formatDateTime(record.sentAt)}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView?.(record.id)}
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {record.status === 'not_sent' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResend?.(record.id)}
                        title="Send for signature"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {(record.status === 'sent' || record.status === 'viewed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemind?.(record.id)}
                        title={`Send reminder (${record.reminderCount} sent)`}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                    {record.status === 'declined' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResend?.(record.id)}
                        title="Resend for signature"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No signing records found</p>
        </div>
      )}
    </div>
  );
}






























