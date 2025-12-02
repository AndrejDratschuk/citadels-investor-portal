import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvestorTable, InvestorRow } from '../components/InvestorTable';

// Mock data - will be replaced with API calls
const mockInvestors: InvestorRow[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    status: 'active',
    accreditationStatus: 'approved',
    commitmentAmount: 500000,
    totalCalled: 375000,
    createdAt: '2023-06-15',
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@example.com',
    status: 'active',
    accreditationStatus: 'approved',
    commitmentAmount: 250000,
    totalCalled: 187500,
    createdAt: '2023-07-20',
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@example.com',
    status: 'onboarding',
    accreditationStatus: 'pending',
    commitmentAmount: 1000000,
    totalCalled: 0,
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    status: 'active',
    accreditationStatus: 'approved',
    commitmentAmount: 750000,
    totalCalled: 562500,
    createdAt: '2023-08-05',
  },
  {
    id: '5',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'rwilson@example.com',
    status: 'prospect',
    accreditationStatus: 'pending',
    commitmentAmount: 0,
    totalCalled: 0,
    createdAt: '2024-02-01',
  },
  {
    id: '6',
    firstName: 'Jennifer',
    lastName: 'Brown',
    email: 'jbrown@example.com',
    status: 'active',
    accreditationStatus: 'approved',
    commitmentAmount: 350000,
    totalCalled: 262500,
    createdAt: '2023-09-12',
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Miller',
    email: 'dmiller@example.com',
    status: 'inactive',
    accreditationStatus: 'expired',
    commitmentAmount: 200000,
    totalCalled: 150000,
    createdAt: '2023-05-01',
  },
  {
    id: '8',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'landerson@example.com',
    status: 'onboarding',
    accreditationStatus: 'pending',
    commitmentAmount: 500000,
    totalCalled: 0,
    createdAt: '2024-01-25',
  },
];

type StatusFilter = 'all' | 'prospect' | 'onboarding' | 'active' | 'inactive';

export function InvestorsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvestors = mockInvestors.filter((investor) => {
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
    all: mockInvestors.length,
    prospect: mockInvestors.filter((i) => i.status === 'prospect').length,
    onboarding: mockInvestors.filter((i) => i.status === 'onboarding').length,
    active: mockInvestors.filter((i) => i.status === 'active').length,
    inactive: mockInvestors.filter((i) => i.status === 'inactive').length,
  };

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
      />
    </div>
  );
}


