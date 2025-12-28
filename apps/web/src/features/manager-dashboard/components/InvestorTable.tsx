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
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvestorStatusBadge } from './InvestorStatusBadge';

export interface InvestorDeal {
  id: string;
  name: string;
  ownershipPercentage: number;
}

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
  deals?: InvestorDeal[];
}

interface InvestorTableProps {
  investors: InvestorRow[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  onDelete?: (investor: InvestorRow) => Promise<void>;
  className?: string;
}

type SortColumn = 'name' | 'status' | 'commitment' | 'called' | 'createdAt';

export function InvestorTable({
  investors,
  onSort,
  onSearch,
  onDelete,
  className,
}: InvestorTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<InvestorRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (investor: InvestorRow) => {
    setDeleteTarget(investor);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const handleDeleteClose = () => {
    setDeleteTarget(null);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmText !== 'DELETE' || !onDelete) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await onDelete(deleteTarget);
      handleDeleteClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete investor';
      setDeleteError(message);
    } finally {
      setDeleteLoading(false);
    }
  };

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
              <th className="p-4 text-left">
                <span className="font-medium text-sm">Deals</span>
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
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
                  <td className="p-4">
                    {investor.deals && investor.deals.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {investor.deals.slice(0, 2).map((deal) => (
                          <Link
                            key={deal.id}
                            to={`/manager/deals/${deal.id}`}
                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                            title={`${deal.name} (${(deal.ownershipPercentage * 100).toFixed(1)}%)`}
                          >
                            {deal.name.length > 15 ? `${deal.name.slice(0, 15)}...` : deal.name}
                          </Link>
                        ))}
                        {investor.deals.length > 2 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            +{investor.deals.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
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
                          <Link
                            to={`/manager/investors/${investor.id}`}
                            className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(investor)}
                            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteClose}
          />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-red-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-red-900">Delete Investor</h2>
              </div>
              <button
                onClick={handleDeleteClose}
                className="p-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                You are about to permanently delete{' '}
                <span className="font-semibold">
                  {deleteTarget.firstName} {deleteTarget.lastName}
                </span>
                . This action cannot be undone.
              </p>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  All associated data will be permanently removed, including:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>Investment records</li>
                  <li>Documents and communications</li>
                  <li>Capital call history</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={cn(
                    'font-mono',
                    deleteConfirmText === 'DELETE' && 'border-red-500 ring-1 ring-red-500'
                  )}
                  autoComplete="off"
                />
              </div>

              {deleteError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={handleDeleteClose}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Investor
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


