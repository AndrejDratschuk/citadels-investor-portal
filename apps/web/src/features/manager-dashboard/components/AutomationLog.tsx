import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  FileText,
  DollarSign,
  UserPlus,
  Bell,
} from 'lucide-react';
import { emailApi, AutomationLogRecord, AutomationType, EmailStatus, AutomationLogFilters } from '@/lib/api/email';
import { cn } from '@/lib/utils';

// Automation type metadata for display
const automationTypeConfig: Record<AutomationType, { label: string; icon: typeof Mail; color: string }> = {
  document_approval: { label: 'Document Approved', icon: FileText, color: 'text-green-600 bg-green-50' },
  document_rejection: { label: 'Document Rejected', icon: FileText, color: 'text-red-600 bg-red-50' },
  documents_approved_docusign: { label: 'DocuSign Ready', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  capital_call_request: { label: 'Capital Call', icon: DollarSign, color: 'text-yellow-600 bg-yellow-50' },
  capital_call_reminder: { label: 'Capital Call Reminder', icon: Bell, color: 'text-orange-600 bg-orange-50' },
  wire_confirmation: { label: 'Wire Confirmed', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  wire_issue: { label: 'Wire Issue', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  welcome_investor: { label: 'Welcome Investor', icon: UserPlus, color: 'text-purple-600 bg-purple-50' },
  account_invite: { label: 'Account Invite', icon: Mail, color: 'text-blue-600 bg-blue-50' },
  verification_code: { label: 'Verification Code', icon: Mail, color: 'text-gray-600 bg-gray-50' },
  kyc_invite: { label: 'KYC Invite', icon: Mail, color: 'text-indigo-600 bg-indigo-50' },
  kyc_reminder: { label: 'KYC Reminder', icon: Bell, color: 'text-orange-600 bg-orange-50' },
  meeting_invite: { label: 'Meeting Invite', icon: Mail, color: 'text-teal-600 bg-teal-50' },
  onboarding_reminder: { label: 'Onboarding Reminder', icon: Bell, color: 'text-orange-600 bg-orange-50' },
  password_reset: { label: 'Password Reset', icon: Mail, color: 'text-gray-600 bg-gray-50' },
  manual_send: { label: 'Manual Email', icon: Mail, color: 'text-gray-600 bg-gray-50' },
};

const statusConfig: Record<EmailStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  sent: { label: 'Sent', icon: CheckCircle, color: 'text-blue-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600' },
  opened: { label: 'Opened', icon: CheckCircle, color: 'text-purple-600' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600' },
};

interface AutomationLogProps {
  investorId?: string;
  compact?: boolean;
}

export function AutomationLog({ investorId, compact = false }: AutomationLogProps) {
  const [logs, setLogs] = useState<AutomationLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Use ref for offset to avoid dependency instability
  const offsetRef = useRef(0);

  // Filters
  const [selectedType, setSelectedType] = useState<AutomationType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EmailStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async (isNewSearch = false) => {
    setIsLoading(true);
    setError(null);

    const currentOffset = isNewSearch ? 0 : offsetRef.current;
    const limit = compact ? 10 : 25;

    const filters: AutomationLogFilters = {
      limit,
      offset: currentOffset,
    };

    if (selectedType !== 'all') {
      filters.automationType = selectedType;
    }
    if (selectedStatus !== 'all') {
      filters.status = selectedStatus;
    }
    if (investorId) {
      filters.investorId = investorId;
    }

    try {
      const response = await emailApi.getAutomationLogs(filters);
      
      if (isNewSearch) {
        setLogs(response.logs);
        offsetRef.current = response.logs.length;
      } else {
        setLogs(prevLogs => [...prevLogs, ...response.logs]);
        offsetRef.current = currentOffset + response.logs.length;
      }
      
      setHasMore(response.pagination.hasMore);
      setTotal(response.pagination.total);
    } catch (err) {
      setError('Failed to load automation logs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedStatus, investorId, compact]);

  useEffect(() => {
    // Reset offset and fetch fresh data when filters change
    offsetRef.current = 0;
    fetchLogs(true);
  }, [selectedType, selectedStatus, investorId, fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getTypeConfig = (type: string | null) => {
    return automationTypeConfig[type as AutomationType] || {
      label: type || 'Unknown',
      icon: Mail,
      color: 'text-gray-600 bg-gray-50',
    };
  };

  const getStatusConfig = (status: EmailStatus) => {
    return statusConfig[status] || { label: status, icon: Clock, color: 'text-gray-600' };
  };

  const renderLogItem = (log: AutomationLogRecord) => {
    const typeConfig = getTypeConfig(log.automationType);
    const statusCfg = getStatusConfig(log.status);
    const TypeIcon = typeConfig.icon;
    const StatusIcon = statusCfg.icon;
    const isExpanded = expandedId === log.id;

    return (
      <div
        key={log.id}
        className="border border-slate-200 rounded-lg bg-white overflow-hidden"
      >
        <button
          onClick={() => setExpandedId(isExpanded ? null : log.id)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('p-2 rounded-lg', typeConfig.color)}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900 text-sm">
                  {typeConfig.label}
                </span>
                <StatusIcon className={cn('w-4 h-4', statusCfg.color)} />
              </div>
              <div className="text-xs text-slate-500 truncate">
                To: {log.recipientEmail}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatDate(log.sentAt)}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Subject:</span>
                <p className="text-slate-900 mt-1">{log.subject}</p>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <p className={cn('mt-1 font-medium', statusCfg.color)}>
                  {statusCfg.label}
                </p>
              </div>
              {log.triggerEvent && (
                <div>
                  <span className="text-slate-500">Trigger:</span>
                  <p className="text-slate-900 mt-1">{log.triggerEvent.replace(/_/g, ' ')}</p>
                </div>
              )}
              {log.errorMessage && (
                <div className="col-span-2">
                  <span className="text-red-600">Error:</span>
                  <p className="text-red-700 mt-1 bg-red-50 p-2 rounded">{log.errorMessage}</p>
                </div>
              )}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="col-span-2">
                  <span className="text-slate-500">Details:</span>
                  <div className="mt-1 bg-white p-2 rounded border border-slate-200 text-xs">
                    <pre className="text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Automation Log</h2>
            <p className="text-sm text-slate-500">
              {total} automated email{total !== 1 ? 's' : ''} sent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors',
                showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => fetchLogs(true)}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && !compact && (
        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Automation Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AutomationType | 'all')}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {Object.entries(automationTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as EmailStatus | 'all')}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && logs.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && logs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No automation logs yet</p>
          <p className="text-sm">Automated emails will appear here when they are sent.</p>
        </div>
      )}

      {/* Log list */}
      {logs.length > 0 && (
        <div className="space-y-2">
          {logs.map(renderLogItem)}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => fetchLogs(false)}
          disabled={isLoading}
          className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

