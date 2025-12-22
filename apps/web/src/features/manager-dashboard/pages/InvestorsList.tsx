import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestorTable, InvestorRow } from '../components/InvestorTable';
import { useInvestors, useDeleteInvestor } from '../hooks/useInvestors';

type StatusFilter = 'all' | 'prospect' | 'onboarding' | 'active' | 'inactive';

export function InvestorsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real investors from API
  const { data: apiInvestors, isLoading, error } = useInvestors();
  const deleteInvestorMutation = useDeleteInvestor();

  const handleDeleteInvestor = async (investor: InvestorRow): Promise<void> => {
    await deleteInvestorMutation.mutateAsync(investor.id);
  };

  // Transform API data to match InvestorRow interface
  const investors: InvestorRow[] = (apiInvestors || []).map((inv) => ({
    id: inv.id,
    firstName: inv.firstName,
    lastName: inv.lastName,
    email: inv.email,
    status: inv.status as InvestorRow['status'],
    accreditationStatus: inv.accreditationStatus as InvestorRow['accreditationStatus'],
    commitmentAmount: inv.commitmentAmount,
    totalCalled: inv.totalCalled,
    createdAt: inv.createdAt,
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
    prospect: investors.filter((i) => i.status === 'prospect').length,
    onboarding: investors.filter((i) => i.status === 'onboarding').length,
    active: investors.filter((i) => i.status === 'active').length,
    inactive: investors.filter((i) => i.status === 'inactive').length,
  };

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
            Manage your fund investors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Link to="/manager/investors/new">
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Investor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {(['all', 'active', 'onboarding', 'prospect', 'inactive'] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                statusFilter === status
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {status === 'all' ? 'Total' : status}
              </p>
              <p className="mt-1 text-2xl font-bold">{statusCounts[status]}</p>
            </button>
          )
        )}
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


