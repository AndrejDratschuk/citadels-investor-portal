import { Link } from 'react-router-dom';
import { Users, Plus, Loader2 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import type { DealInvestor } from '@/lib/api/deals';
import type { MockInvestor } from './dealDetailMockData';

interface InvestorsTabProps {
  dealInvestors: DealInvestor[];
  mockInvestors: MockInvestor[];
  isRealDeal: boolean;
  isLoading: boolean;
  onManageInvestors: () => void;
}

export function InvestorsTab({
  dealInvestors,
  mockInvestors,
  isRealDeal,
  isLoading,
  onManageInvestors,
}: InvestorsTabProps): JSX.Element {
  const investors = isRealDeal ? dealInvestors : mockInvestors;
  const isEmpty = investors.length === 0;

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Deal Investors</h3>
          <p className="text-sm text-muted-foreground">
            Investors who are invested in this deal
          </p>
        </div>
        {isRealDeal && (
          <Button onClick={onManageInvestors}>
            <Plus className="mr-2 h-4 w-4" />
            Manage Investors
          </Button>
        )}
      </div>

      {/* Investors List */}
      <div className="rounded-xl border bg-card">
        {isLoading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState isRealDeal={isRealDeal} />
        ) : isRealDeal ? (
          <RealInvestorsList investors={dealInvestors} />
        ) : (
          <MockInvestorsList investors={mockInvestors} />
        )}
      </div>
    </div>
  );
}

function LoadingState(): JSX.Element {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

interface EmptyStateProps {
  isRealDeal: boolean;
}

function EmptyState({ isRealDeal }: EmptyStateProps): JSX.Element {
  return (
    <div className="p-8 text-center">
      <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <p className="mt-3 font-medium">No investors yet</p>
      <p className="text-sm text-muted-foreground">
        {isRealDeal
          ? 'Click "Manage Investors" to add investors to this deal'
          : 'Investors will appear here once assigned to this deal'}
      </p>
    </div>
  );
}

interface RealInvestorsListProps {
  investors: DealInvestor[];
}

function RealInvestorsList({ investors }: RealInvestorsListProps): JSX.Element {
  return (
    <div className="divide-y">
      {investors.map((investor) => (
        <div
          key={investor.id}
          className="flex items-center justify-between p-4 hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link
                to={`/manager/investors/${investor.id}`}
                className="font-medium hover:underline"
              >
                {investor.firstName} {investor.lastName}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatPercentage(investor.ownershipPercentage)} ownership
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {formatCurrency(investor.commitmentAmount * investor.ownershipPercentage)}
            </p>
            <p className="text-sm text-muted-foreground">Invested</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface MockInvestorsListProps {
  investors: MockInvestor[];
}

function MockInvestorsList({ investors }: MockInvestorsListProps): JSX.Element {
  return (
    <div className="divide-y">
      {investors.map((investor) => (
        <div
          key={investor.id}
          className="flex items-center justify-between p-4 hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link
                to={`/manager/investors/${investor.id}`}
                className="font-medium hover:underline"
              >
                {investor.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatPercentage(investor.ownershipPercentage)} ownership
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(investor.investedAmount)}</p>
            <p className="text-sm text-muted-foreground">Invested</p>
          </div>
        </div>
      ))}
    </div>
  );
}
