import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Building2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';
import { useInvestorStats, useInvestorProfile } from '../hooks/useInvestorData';
import { useDocuments } from '../hooks/useDocuments';
import { useCapitalCalls } from '../hooks/useCapitalCalls';
import { StatsCard } from '../components/StatsCard';
import { DocumentList } from '../components/DocumentList';
import { CapitalCallCard } from '../components/CapitalCallCard';
import { Button } from '@/components/ui/button';

export function InvestorDashboard() {
  const { data: profile, isLoading: profileLoading } = useInvestorProfile();
  const { data: stats, isLoading: statsLoading } = useInvestorStats();
  const { data: documents, isLoading: docsLoading } = useDocuments();
  const { data: capitalCalls, isLoading: ccLoading } = useCapitalCalls();

  const isLoading = profileLoading || statsLoading || docsLoading || ccLoading;

  const pendingCapitalCalls = capitalCalls?.filter(
    (cc) => cc.status === 'pending' || cc.status === 'partial'
  );

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

      {/* Pending Capital Calls Alert */}
      {pendingCapitalCalls && pendingCapitalCalls.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-800">
                You have {pendingCapitalCalls.length} pending capital call
                {pendingCapitalCalls.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-orange-700">
                Total due: {formatCurrency(stats?.pendingAmount || 0)}
              </p>
            </div>
            <Link to="/investor/capital-calls">
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
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

        {/* Pending Capital Calls */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Capital Calls</h2>
            <Link
              to="/investor/capital-calls"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {pendingCapitalCalls && pendingCapitalCalls.length > 0 ? (
            <div className="space-y-4">
              {pendingCapitalCalls.slice(0, 3).map((cc) => (
                <CapitalCallCard key={cc.id} capitalCall={cc} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No pending capital calls
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
