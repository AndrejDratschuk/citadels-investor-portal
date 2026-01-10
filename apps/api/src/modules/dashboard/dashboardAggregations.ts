/**
 * Dashboard Aggregations (Pure Functions)
 * Stateless functions with no side effects - following CODE_GUIDELINES.md
 * No DB calls, no Date(), no Math.random() - all values injected
 */

import type {
  DealSummary,
  InvestorSummary,
  CapitalCallSummary,
  KpiDataSummary,
  FundDashboardStats,
  PortfolioDealItem,
  InvestorStatusGroup,
  TopKpiItem,
  ActiveCapitalCall,
} from './dashboard.types';

// ============================================
// Portfolio Calculations
// ============================================

export function calculateTotalAUM(deals: DealSummary[]): number {
  return deals.reduce((sum, deal) => sum + (deal.currentValue ?? 0), 0);
}

export function buildPortfolioByDeal(deals: DealSummary[]): PortfolioDealItem[] {
  return deals
    .filter((deal) => deal.currentValue !== null && deal.currentValue > 0)
    .map((deal) => ({
      dealId: deal.id,
      name: deal.name,
      value: deal.currentValue ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function countActiveDeals(deals: DealSummary[]): number {
  const activeStatuses = ['acquired', 'renovating', 'stabilized'];
  return deals.filter((deal) => activeStatuses.includes(deal.status)).length;
}

// ============================================
// Investor Calculations
// ============================================

export function groupInvestorsByStatus(investors: InvestorSummary[]): InvestorStatusGroup[] {
  const statusMap = new Map<string, number>();

  for (const investor of investors) {
    const status = investor.status || 'unknown';
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateCapitalDeployed(investors: InvestorSummary[]): number {
  return investors.reduce((sum, inv) => sum + (inv.commitmentAmount ?? 0), 0);
}

// ============================================
// Capital Call Calculations
// ============================================

export function countPendingCapitalCalls(capitalCalls: CapitalCallSummary[]): number {
  const pendingStatuses = ['pending', 'partial', 'sent'];
  return capitalCalls.filter((cc) => pendingStatuses.includes(cc.status)).length;
}

export function buildActiveCapitalCallsList(
  capitalCalls: CapitalCallSummary[]
): ActiveCapitalCall[] {
  const activeStatuses = ['pending', 'partial', 'sent'];
  return capitalCalls
    .filter((cc) => activeStatuses.includes(cc.status))
    .map((cc) => ({
      id: cc.id,
      dealName: cc.dealName,
      totalAmount: cc.totalAmount,
      receivedAmount: cc.receivedAmount,
      dueDate: cc.dueDate,
      status: cc.status as 'pending' | 'partial' | 'sent',
    }))
    .slice(0, 5); // Top 5 active calls
}

// ============================================
// KPI Calculations
// ============================================

export function calculateKpiChangePercent(
  currentValue: number,
  previousValue: number | null
): number | null {
  if (previousValue === null || previousValue === 0) {
    return null;
  }
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

export function buildTopKpis(kpiData: KpiDataSummary[], limit: number): TopKpiItem[] {
  return kpiData.slice(0, limit).map((kpi) => ({
    kpiCode: kpi.kpiCode,
    name: kpi.kpiName,
    value: kpi.value,
    changePercent: calculateKpiChangePercent(kpi.value, kpi.previousValue),
    format: 'number', // Will be enriched from definitions
  }));
}

// ============================================
// Main Aggregation Function
// ============================================

export function calculateFundStats(
  deals: DealSummary[],
  investors: InvestorSummary[],
  capitalCalls: CapitalCallSummary[],
  kpiData: KpiDataSummary[],
  now: Date,
  options: { kpiLimit: number }
): FundDashboardStats {
  const totalAUM = calculateTotalAUM(deals);
  const capitalDeployed = calculateCapitalDeployed(investors);

  return {
    totalAUM,
    totalInvestors: investors.length,
    activeDeals: countActiveDeals(deals),
    pendingCapitalCalls: countPendingCapitalCalls(capitalCalls),
    capitalDeployed,
    uncommittedCapital: Math.max(0, totalAUM - capitalDeployed),
    portfolioByDeal: buildPortfolioByDeal(deals),
    investorsByStatus: groupInvestorsByStatus(investors),
    topKpis: buildTopKpis(kpiData, options.kpiLimit),
    activeCapitalCallsList: buildActiveCapitalCallsList(capitalCalls),
    generatedAt: now.toISOString(),
  };
}




