import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Search,
  MoreHorizontal,
  Mail,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@flowveda/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvestorStatusBadge } from './InvestorStatusBadge';

export interface InvestorRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'prospect' | 'onboarding' | 'active' | 'inactive';
  accreditationStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  commitmentAmount: number;
  totalCalled: number;
  createdAt: string;
}

interface InvestorTableProps {
  investors: InvestorRow[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  className?: string;
}

type SortColumn = 'name' | 'status' | 'commitment' | 'called' | 'createdAt';

export function InvestorTable({
  investors,
  onSort,
  onSearch,
  className,
}: InvestorTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSort = (column: SortColumn) => {
    const newDirection =
      sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === investors.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(investors.map((i) => i.id)));
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Table Header */}
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedRows.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.size} selected
            </span>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedRows.size === investors.length && investors.length > 0}
                  onChange={toggleAllRows}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 font-medium text-sm"
                >
                  Name <SortIcon column="name" />
                </button>
              </th>
              <th className="p-4 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 font-medium text-sm"
                >
                  Status <SortIcon column="status" />
                </button>
              </th>
              <th className="p-4 text-left">
                <span className="font-medium text-sm">Accreditation</span>
              </th>
              <th className="p-4 text-right">
                <button
                  onClick={() => handleSort('commitment')}
                  className="flex items-center gap-1 font-medium text-sm ml-auto"
                >
                  Commitment <SortIcon column="commitment" />
                </button>
              </th>
              <th className="p-4 text-right">
                <button
                  onClick={() => handleSort('called')}
                  className="flex items-center gap-1 font-medium text-sm ml-auto"
                >
                  Called <SortIcon column="called" />
                </button>
              </th>
              <th className="w-16 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {investors.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No investors found
                </td>
              </tr>
            ) : (
              investors.map((investor) => (
                <tr
                  key={investor.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(investor.id)}
                      onChange={() => toggleRowSelection(investor.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/manager/investors/${investor.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {investor.firstName} {investor.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {investor.email}
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <InvestorStatusBadge status={investor.status} type="investor" />
                  </td>
                  <td className="p-4">
                    <InvestorStatusBadge
                      status={investor.accreditationStatus}
                      type="accreditation"
                    />
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(investor.commitmentAmount)}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(investor.totalCalled)}
                  </td>
                  <td className="p-4">
                    <div className="relative group">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full z-10 hidden group-hover:block">
                        <div className="mt-1 rounded-md border bg-popover p-1 shadow-md">
                          <Link
                            to={`/manager/investors/${investor.id}`}
                            className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Eye className="h-4 w-4" /> View
                          </Link>
                          <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted">
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t p-4">
        <p className="text-sm text-muted-foreground">
          Showing {investors.length} investors
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}


