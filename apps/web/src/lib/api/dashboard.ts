/**
 * Dashboard API Client
 * Frontend client for dashboard endpoints
 */

import { api } from './client';

// ============================================
// Types (matching backend types)
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

// ============================================
// API Options
// ============================================

export interface DashboardStatsOptions {
  includeKpis?: boolean;
  kpiLimit?: number;
}

// ============================================
// API Client
// ============================================

export const dashboardApi = {
  /**
   * Get aggregated fund dashboard statistics
   */
  getStats: async (options?: DashboardStatsOptions): Promise<FundDashboardStats> => {
    const params = new URLSearchParams();
    
    if (options?.includeKpis !== undefined) {
      params.append('includeKpis', String(options.includeKpis));
    }
    
    if (options?.kpiLimit !== undefined) {
      params.append('kpiLimit', String(options.kpiLimit));
    }
    
    const queryString = params.toString();
    const endpoint = `/dashboard/stats${queryString ? `?${queryString}` : ''}`;
    
    return api.get<FundDashboardStats>(endpoint);
  },
};







