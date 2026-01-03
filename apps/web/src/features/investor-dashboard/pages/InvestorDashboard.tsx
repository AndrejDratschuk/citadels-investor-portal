import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Building2,
  AlertCircle,
  ArrowRight,
  Bell,
  Filter,
  BarChart3,
  Info,
} from 'lucide-react';
import { formatCurrency, INVESTOR_TYPE_LABELS } from '@altsui/shared';
import { useInvestorStats, useInvestorProfile } from '../hooks/useInvestorData';
import { useDocuments } from '../hooks/useDocuments';
import { useNotices } from '../hooks/useNotices';
import { useCommunications } from '../hooks/useCommunications';
import { useInvestorPermissions, canViewDetailedKpis, canViewOutliers } from '../hooks/useInvestorPermissions';
import { StatsCard } from '../components/StatsCard';
import { DocumentList } from '../components/DocumentList';
import { NoticeCard, NoticeType } from '../components/NoticeCard';
import { CommunicationsPreview } from '../components/CommunicationsPreview';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NoticeFilter = 'all' | NoticeType | 'action_required';

const filterLabels: Record<NoticeFilter, string> = {
  all: 'All',
  action_required: 'Action Required',
  capital_call: 'Capital Calls',
  distribution: 'Distributions',
  distribution_election: 'Elections',
  quarterly_meeting: 'Meetings',
  announcement: 'Announcements',
};

export function InvestorDashboard() {
  const { data: profile, isLoading: profileLoading } = useInvestorProfile();
  const { data: stats, isLoading: statsLoading } = useInvestorStats();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: noticesData, isLoading: noticesLoading } = useNotices();
  const { data: communicationsData, isLoading: commsLoading } = useCommunications();
  const { data: permissions } = useInvestorPermissions();
  const [noticeFilter, setNoticeFilter] = useState<NoticeFilter>('all');

  const isLoading = profileLoading || statsLoading || docsLoading || noticesLoading || commsLoading;
  
  // Permission-based feature flags
  const showDetailedKpis = canViewDetailedKpis(permissions);
  const showOutliers = canViewOutliers(permissions);

  const actionRequiredNotices = noticesData?.actionRequired || [];
  const pendingCapitalCalls = noticesData?.capitalCalls.filter(
    (n) => n.status === 'pending' || n.status === 'partial'
  ) || [];

  // Get filtered notices based on selected filter
  const getFilteredNotices = () => {
    if (!noticesData) return [];
    
    switch (noticeFilter) {
      case 'all':
        return noticesData.all;
      case 'action_required':
        return noticesData.actionRequired;
      case 'capital_call':
        return noticesData.capitalCalls;
      case 'distribution':
        return noticesData.distributions;
      case 'distribution_election':
        return noticesData.elections;
      case 'quarterly_meeting':
        return noticesData.meetings;
      case 'announcement':
        return noticesData.announcements;
      default:
        return noticesData.all;
    }
  };

  const filteredNotices = getFilteredNotices();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.firstName || 'Investor'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's an overview of your investments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Commitment"
          value={formatCurrency(stats?.commitmentAmount || 0)}
          icon={DollarSign}
          description="Your total fund commitment"
        />
        <StatsCard
          title="Capital Called"
          value={formatCurrency(stats?.totalCalled || 0)}
          icon={TrendingUp}
          description="Amount called to date"
        />
        <StatsCard
          title="Active Investments"
          value={stats?.activeInvestments || 0}
          icon={Building2}
          description="Properties in portfolio"
        />
        <StatsCard
          title="Est. Portfolio Value"
          value={formatCurrency(stats?.totalInvestmentValue || 0)}
          icon={TrendingUp}
          description="Your share of current values"
        />
      </div>

      {/* Investor Type Info Banner - Show for limited access investors */}
      {permissions && !showDetailedKpis && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">
                {INVESTOR_TYPE_LABELS[permissions.investorType]} Dashboard
              </p>
              <p className="text-sm text-blue-700">
                You're viewing a summary of your investments. Detailed financial metrics and KPI breakdowns are available to investors with enhanced access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced KPI Section - Only for investors with detailed access */}
      {showDetailedKpis && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Detailed Performance</h2>
            </div>
            {showOutliers && (
              <Link
                to="/investor/investments"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View Outliers <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Access detailed financial KPIs, performance metrics, and investment analysis through your investments page.
          </p>
          <Link to="/investor/investments">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Detailed KPIs
            </Button>
          </Link>
        </div>
      )}

      {/* Action Required Alert */}
      {actionRequiredNotices.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">
                You have {actionRequiredNotices.length} item
                {actionRequiredNotices.length > 1 ? 's' : ''} requiring action
              </p>
              <p className="text-sm text-orange-700">
                {pendingCapitalCalls.length > 0 && (
                  <>
                    {pendingCapitalCalls.length} capital call
                    {pendingCapitalCalls.length > 1 ? 's' : ''} pending
                    {actionRequiredNotices.length > pendingCapitalCalls.length && ' • '}
                  </>
                )}
                {actionRequiredNotices.length - pendingCapitalCalls.length > 0 && (
                  <>
                    {actionRequiredNotices.length - pendingCapitalCalls.length} other action
                    {actionRequiredNotices.length - pendingCapitalCalls.length > 1 ? 's' : ''} needed
                  </>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNoticeFilter('action_required')}
            >
              View All
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Documents */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Documents</h2>
            <Link
              to="/investor/documents"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <DocumentList documents={documents || []} limit={5} />
        </div>

        {/* Notices Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Notices</h2>
              {noticesData && noticesData.counts.total > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {noticesData.counts.total}
                </span>
              )}
            </div>
            <Link
              to="/investor/notices"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Filter className="h-4 w-4 text-muted-foreground self-center" />
            {(['all', 'action_required', 'capital_call', 'distribution', 'quarterly_meeting'] as const).map(
              (filter) => {
                const count =
                  filter === 'all'
                    ? noticesData?.counts.total
                    : filter === 'action_required'
                    ? noticesData?.counts.actionRequired
                    : filter === 'capital_call'
                    ? noticesData?.counts.capitalCalls
                    : filter === 'distribution'
                    ? noticesData?.counts.distributions
                    : filter === 'quarterly_meeting'
                    ? noticesData?.counts.meetings
                    : 0;

                if (count === 0 && filter !== 'all') return null;

                return (
                  <button
                    key={filter}
                    onClick={() => setNoticeFilter(filter)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      noticeFilter === filter
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {filterLabels[filter]}
                    {count !== undefined && count > 0 && (
                      <span className="ml-1 opacity-70">({count})</span>
                    )}
                  </button>
                );
              }
            )}
          </div>

          {/* Notices List */}
          {filteredNotices.length > 0 ? (
            <div className="space-y-4">
              {filteredNotices.slice(0, 4).map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onAction={(n) => {
                    if (n.actionUrl) {
                      window.location.href = n.actionUrl;
                    }
                  }}
                />
              ))}
              {filteredNotices.length > 4 && (
                <Link to="/investor/notices">
                  <Button variant="outline" className="w-full">
                    View {filteredNotices.length - 4} more notices
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {noticeFilter === 'all'
                  ? 'No notices at this time'
                  : `No ${filterLabels[noticeFilter].toLowerCase()} notices`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Communications Preview */}
      <CommunicationsPreview
        communications={communicationsData?.previews || []}
        isLoading={commsLoading}
        limit={5}
      />
    </div>
  );
}
