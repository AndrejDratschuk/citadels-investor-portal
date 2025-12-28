import { useState, useEffect } from 'react';
import { Download, Loader2, AlertCircle, Users, DollarSign, TrendingUp, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestorTable, InvestorRow, InvestorDeal } from '../components/InvestorTable';
import { useInvestors, useDeleteInvestor } from '../hooks/useInvestors';
import { investorsApi } from '@/lib/api/investors';

type StatusFilter = 'all' | 'active' | 'inactive' | 'exited';

export function InvestorsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [investorDeals, setInvestorDeals] = useState<Record<string, InvestorDeal[]>>({});

  // Fetch real investors from API
  const { data: apiInvestors, isLoading, error } = useInvestors();
  const deleteInvestorMutation = useDeleteInvestor();

  // Fetch deals for all investors
  useEffect(() => {
    async function fetchAllInvestorDeals() {
      if (!apiInvestors || apiInvestors.length === 0) return;

      const dealsMap: Record<string, InvestorDeal[]> = {};
      
      // Fetch deals for each investor in parallel
      await Promise.all(
        apiInvestors.map(async (investor) => {
          try {
            const investments = await investorsApi.getInvestorDeals(investor.id);
            dealsMap[investor.id] = investments
              .filter(inv => inv.deal)
              .map(inv => ({
                id: inv.deal!.id,
                name: inv.deal!.name,
                ownershipPercentage: inv.ownershipPercentage,
              }));
          } catch (err) {
            // If fetching fails for one investor, just skip
            dealsMap[investor.id] = [];
          }
        })
      );

      setInvestorDeals(dealsMap);
    }

    fetchAllInvestorDeals();
  }, [apiInvestors]);

  const handleDeleteInvestor = async (investor: InvestorRow): Promise<void> => {
    await deleteInvestorMutation.mutateAsync(investor.id);
  };

  // Filter to only show confirmed investors (active, inactive, exited)
  // Prospects and onboarding investors are now in the Pipeline
  const confirmedStatuses = ['active', 'inactive', 'exited'];
  const investors: InvestorRow[] = (apiInvestors || [])
    .filter((inv) => confirmedStatuses.includes(inv.status))
    .map((inv) => ({
      id: inv.id,
      firstName: inv.firstName,
      lastName: inv.lastName,
      email: inv.email,
      status: inv.status as InvestorRow['status'],
      accreditationStatus: inv.accreditationStatus as InvestorRow['accreditationStatus'],
      commitmentAmount: inv.commitmentAmount,
      totalCalled: inv.totalCalled,
      createdAt: inv.createdAt,
      deals: investorDeals[inv.id] || [],
    }));

  const filteredInvestors = investors.filter((investor) => {
    // Status filter
    if (statusFilter !== 'all' && investor.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        investor.firstName.toLowerCase().includes(query) ||
        investor.lastName.toLowerCase().includes(query) ||
        investor.email.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const statusCounts = {
    all: investors.length,
    active: investors.filter((i) => i.status === 'active').length,
    inactive: investors.filter((i) => i.status === 'inactive').length,
    exited: investors.filter((i) => (i.status as string) === 'exited').length,
  };

  // Calculate aggregate metrics
  const totalCommitted = investors.reduce((sum, inv) => sum + (inv.commitmentAmount || 0), 0);
  const totalCalled = investors.reduce((sum, inv) => sum + (inv.totalCalled || 0), 0);
  const avgInvestment = investors.length > 0 ? totalCommitted / investors.length : 0;

  // Calculate new investors this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const newThisMonth = investors.filter((inv) => new Date(inv.createdAt) >= thisMonth).length;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading investors...</p>
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
          <h2 className="mt-4 text-xl font-semibold">Failed to Load Investors</h2>
          <p className="mt-2 text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="mt-1 text-muted-foreground">
            Confirmed investors in your fund
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Active Investors</p>
          </div>
          <p className="mt-2 text-2xl font-bold">{statusCounts.active}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <p className="text-sm font-medium text-muted-foreground">Total Committed</p>
          </div>
          <p className="mt-2 text-2xl font-bold">${(totalCommitted / 1000000).toFixed(1)}M</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <p className="text-sm font-medium text-muted-foreground">Total Called</p>
          </div>
          <p className="mt-2 text-2xl font-bold">${(totalCalled / 1000000).toFixed(1)}M</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <p className="text-sm font-medium text-muted-foreground">Avg Investment</p>
          </div>
          <p className="mt-2 text-2xl font-bold">${(avgInvestment / 1000).toFixed(0)}K</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium text-muted-foreground">New This Month</p>
          </div>
          <p className="mt-2 text-2xl font-bold">{newThisMonth}</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive', 'exited'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Investor Table */}
      <InvestorTable
        investors={filteredInvestors}
        onSearch={setSearchQuery}
        onDelete={handleDeleteInvestor}
      />
    </div>
  );
}


