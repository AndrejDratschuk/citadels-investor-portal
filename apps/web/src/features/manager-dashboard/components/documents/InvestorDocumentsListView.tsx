import { Search, Users, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DocumentsByInvestor } from './types';

interface InvestorDocumentsListViewProps {
  investors: DocumentsByInvestor[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onInvestorClick: (investor: DocumentsByInvestor) => void;
}

export function InvestorDocumentsListView({
  investors,
  isLoading,
  searchQuery,
  onSearchChange,
  onInvestorClick,
}: InvestorDocumentsListViewProps) {
  const filteredInvestors = investors.filter(
    (inv) =>
      !searchQuery ||
      inv.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search investors..."
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
                <th className="p-4 text-left text-sm font-medium">Investor Name</th>
                <th className="p-4 text-left text-sm font-medium">Email</th>
                <th className="p-4 text-left text-sm font-medium">Documents</th>
                <th className="w-16 p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Loading investors...
                  </td>
                </tr>
              ) : filteredInvestors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4">No investors found</p>
                  </td>
                </tr>
              ) : (
                filteredInvestors.map((investor) => (
                  <tr
                    key={investor.investorId}
                    className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => onInvestorClick(investor)}
                  >
                    <td className="p-4">
                      <span className="font-medium text-primary hover:underline">
                        {investor.investorName}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{investor.email}</td>
                    <td className="p-4 text-muted-foreground">
                      {investor.documentCount} documents
                    </td>
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

