/**
 * Dashboard Types (Anemic Data Structures)
 * Pure interfaces with no logic - following CODE_GUIDELINES.md
 */

// ============================================
// Raw Data from Repositories
// ============================================

export interface DealSummary {
  id: string;
  name: string;
  currentValue: number | null;
  status: string;
}

export interface InvestorSummary {
  id: string;
  status: string;
  commitmentAmount: number;
}

export interface CapitalCallSummary {
  id: string;
  dealId: string;
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  status: 'pending' | 'partial' | 'sent' | 'completed' | 'cancelled';
  dueDate: string | null;
}

export interface KpiDataSummary {
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  value: number;
  periodDate: string;
  previousValue: number | null;
}

// ============================================
// Aggregated Output Types
// ============================================

export interface PortfolioDealItem {
  dealId: string;
  name: string;
  value: number;
}

export interface InvestorStatusGroup {
  status: string;
  count: number;
}

export interface TopKpiItem {
  kpiCode: string;
  name: string;
  value: number;
  changePercent: number | null;
  format: string;
}

export interface ActiveCapitalCall {
  id: string;
  dealName: string;
  totalAmount: number;
  receivedAmount: number;
  dueDate: string | null;
  status: 'pending' | 'partial' | 'sent';
}

export interface FundDashboardStats {
  totalAUM: number;
  totalInvestors: number;
  activeDeals: number;
  pendingCapitalCalls: number;
  capitalDeployed: number;
  uncommittedCapital: number;
  portfolioByDeal: PortfolioDealItem[];
  investorsByStatus: InvestorStatusGroup[];
  topKpis: TopKpiItem[];
  activeCapitalCallsList: ActiveCapitalCall[];
  generatedAt: string;
}









