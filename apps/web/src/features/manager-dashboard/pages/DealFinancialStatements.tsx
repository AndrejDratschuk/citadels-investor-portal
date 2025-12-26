/**
 * Deal Financial Statements Page
 * Displays Income Statement, Balance Sheet, and Cash Flow Statement
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { financialStatementsApi } from '@/lib/api/kpis';
import { dealsApi } from '@/lib/api/deals';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@flowveda/shared';
import type { StatementType, FinancialStatementData, FinancialStatementLineItem } from '@flowveda/shared';

// ============================================
// Types
// ============================================
type TabType = StatementType;

interface StatementTab {
  type: TabType;
  label: string;
}

const TABS: StatementTab[] = [
  { type: 'income', label: 'Income Statement' },
  { type: 'balance_sheet', label: 'Balance Sheet' },
  { type: 'cash_flow', label: 'Cash Flow Statement' },
];

// ============================================
// Mock Data
// ============================================
const MOCK_INCOME_STATEMENT: FinancialStatementData = {
  sections: [
    {
      title: 'Revenue',
      items: [
        { label: 'Rental Income', value: 1420000 },
        { label: 'Other Income', value: 45000 },
        { label: 'Total Revenue', value: 1465000, isSubtotal: true },
      ],
      subtotal: 1465000,
    },
    {
      title: 'Operating Expenses',
      items: [
        { label: 'Property Management', value: 73250 },
        { label: 'Maintenance & Repairs', value: 87600 },
        { label: 'Insurance', value: 36500 },
        { label: 'Property Taxes', value: 146500 },
        { label: 'Utilities', value: 43800 },
        { label: 'Administrative', value: 29200 },
        { label: 'Total Operating Expenses', value: 416850, isSubtotal: true },
      ],
      subtotal: 416850,
    },
    {
      title: 'Net Operating Income',
      items: [
        { label: 'NOI', value: 1048150, isTotal: true },
      ],
    },
    {
      title: 'Below the Line',
      items: [
        { label: 'Debt Service', value: 672000 },
        { label: 'Capital Expenditures', value: 85000 },
        { label: 'Total Below the Line', value: 757000, isSubtotal: true },
      ],
      subtotal: 757000,
    },
    {
      title: 'Net Cash Flow',
      items: [
        { label: 'Net Cash Flow', value: 291150, isTotal: true },
      ],
    },
  ],
  total: 291150,
};

const MOCK_BALANCE_SHEET: FinancialStatementData = {
  sections: [
    {
      title: 'Assets',
      items: [
        { label: 'Property Value', value: 14200000 },
        { label: 'Cash & Reserves', value: 425000 },
        { label: 'Accounts Receivable', value: 32000 },
        { label: 'Prepaid Expenses', value: 18500 },
        { label: 'Total Assets', value: 14675500, isSubtotal: true },
      ],
      subtotal: 14675500,
    },
    {
      title: 'Liabilities',
      items: [
        { label: 'Mortgage Payable', value: 8804000 },
        { label: 'Accounts Payable', value: 45200 },
        { label: 'Security Deposits', value: 142000 },
        { label: 'Accrued Expenses', value: 28500 },
        { label: 'Total Liabilities', value: 9019700, isSubtotal: true },
      ],
      subtotal: 9019700,
    },
    {
      title: 'Equity',
      items: [
        { label: 'Investor Equity', value: 5200000 },
        { label: 'Retained Earnings', value: 455800 },
        { label: 'Total Equity', value: 5655800, isSubtotal: true },
      ],
      subtotal: 5655800,
    },
    {
      title: 'Total',
      items: [
        { label: 'Total Liabilities & Equity', value: 14675500, isTotal: true },
      ],
    },
  ],
  total: 14675500,
};

const MOCK_CASH_FLOW: FinancialStatementData = {
  sections: [
    {
      title: 'Operating Activities',
      items: [
        { label: 'Net Operating Income', value: 1048150 },
        { label: 'Changes in Receivables', value: -8500 },
        { label: 'Changes in Payables', value: 12300 },
        { label: 'Cash from Operations', value: 1051950, isSubtotal: true },
      ],
      subtotal: 1051950,
    },
    {
      title: 'Investing Activities',
      items: [
        { label: 'Capital Improvements', value: -85000 },
        { label: 'Equipment Purchases', value: -12500 },
        { label: 'Cash from Investing', value: -97500, isSubtotal: true },
      ],
      subtotal: -97500,
    },
    {
      title: 'Financing Activities',
      items: [
        { label: 'Principal Payments', value: -96000 },
        { label: 'Interest Payments', value: -576000 },
        { label: 'Distributions', value: -150000 },
        { label: 'Cash from Financing', value: -822000, isSubtotal: true },
      ],
      subtotal: -822000,
    },
    {
      title: 'Net Change in Cash',
      items: [
        { label: 'Net Change in Cash', value: 132450, isTotal: true },
      ],
    },
  ],
  total: 132450,
};

const MOCK_STATEMENTS: Record<StatementType, FinancialStatementData> = {
  income: MOCK_INCOME_STATEMENT,
  balance_sheet: MOCK_BALANCE_SHEET,
  cash_flow: MOCK_CASH_FLOW,
};

// ============================================
// Statement Table Component
// ============================================
interface StatementTableProps {
  data: FinancialStatementData;
  isLoading?: boolean;
}

function StatementTable({ data, isLoading }: StatementTableProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-5 w-32 mb-3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between py-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            {section.title}
          </h3>
          <div className="space-y-1">
            {section.items.map((item, itemIdx) => (
              <div
                key={itemIdx}
                className={cn(
                  'flex justify-between py-2 px-2 rounded-md',
                  item.isTotal && 'bg-primary/5 font-bold text-lg mt-2',
                  item.isSubtotal && 'border-t font-semibold',
                  item.indent && `pl-${4 + item.indent * 4}`
                )}
              >
                <span className={cn(item.isTotal && 'text-primary')}>
                  {item.label}
                </span>
                <span className={cn(
                  item.value < 0 && 'text-red-600',
                  item.isTotal && 'text-primary'
                )}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export function DealFinancialStatements(): JSX.Element {
  const { id: dealId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('income');

  // Fetch deal info
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.getById(dealId!),
    enabled: !!dealId,
  });

  // Fetch statements (for now use mock data)
  const { data: statements, isLoading: isStatementsLoading } = useQuery({
    queryKey: ['financial-statements', dealId, activeTab],
    queryFn: () => financialStatementsApi.getLatest(dealId!, activeTab),
    enabled: !!dealId,
  });

  const isLoading = isDealLoading || isStatementsLoading;

  // Use mock data for display
  const displayData = MOCK_STATEMENTS[activeTab];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={`/manager/deals/${dealId}/financials`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Financials
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <FileText className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Financial Statements</h1>
            {deal && (
              <p className="text-sm text-muted-foreground">{deal.name}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.type
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Period:</span>
          <Button variant="outline" size="sm" className="gap-1">
            October 2024
            <ChevronRight className="h-3 w-3 rotate-90" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          All amounts in USD
        </span>
      </div>

      {/* Statement Content */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <StatementTable data={displayData} isLoading={isLoading} />
      </div>

      {/* Notes Section */}
      <div className="rounded-xl border bg-muted/50 p-4">
        <h3 className="font-medium text-sm mb-2">Notes</h3>
        <p className="text-sm text-muted-foreground">
          Financial statements are prepared in accordance with generally accepted accounting
          principles (GAAP). For detailed line item breakdowns, please refer to the source
          documents or contact your fund administrator.
        </p>
      </div>
    </div>
  );
}

