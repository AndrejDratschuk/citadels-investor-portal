import { Search, Building2, ChevronRight } from 'lucide-react';
import { formatDate, formatCurrency } from '@flowveda/shared';
import { Input } from '@/components/ui/input';
import { statusLabels } from '@/lib/api/deals';
import { DocumentsByDeal } from './types';

interface DealDocumentsListViewProps {
  deals: DocumentsByDeal[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDealClick: (deal: DocumentsByDeal) => void;
}

export function DealDocumentsListView({
  deals,
  isLoading,
  searchQuery,
  onSearchChange,
  onDealClick,
}: DealDocumentsListViewProps) {
  const filteredDeals = deals.filter(
    (deal) => !searchQuery || deal.dealName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search deals..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left text-sm font-medium">Deal Name</th>
                <th className="p-4 text-left text-sm font-medium">Investors</th>
                <th className="p-4 text-left text-sm font-medium">Close Date</th>
                <th className="p-4 text-left text-sm font-medium">Total Equity</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Documents</th>
                <th className="w-16 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading deals...
                  </td>
                </tr>
              ) : filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4">No deals found</p>
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr
                    key={deal.dealId}
                    className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onDealClick(deal)}
                  >
                    <td className="p-4">
                      <span className="font-medium text-primary hover:underline">
                        {deal.dealName}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {deal.investorCount > 0 ? `${deal.investorCount} investors` : '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {deal.closeDate ? formatDate(deal.closeDate) : '—'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {deal.totalEquity > 0 ? formatCurrency(deal.totalEquity) : '—'}
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize">
                        {statusLabels[deal.dealStatus] || deal.dealStatus}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{deal.documentCount} documents</td>
                    <td className="p-4">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

