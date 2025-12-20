/**
 * Dashboard API Client
 * Types mirror backend dashboard.types.ts
 */

import { api } from './client';

// --- Types ---

export interface FundKpis {
  totalAum: number | null;
  committedCapital: number | null;
  capitalCalled: number | null;
  capitalDeployed: number | null;
  cashOnHand: number | null;
  debtOutstanding: number | null;
  fundRoiPercent: number | null;
  irrPercent: number | null;
}

export interface DealRollups {
  capitalInvested: number;
  capitalCollected: number;
  capitalOutstanding: number;
  capitalReserves: number;
}

export interface TopDeal {
  id: string;
  name: string;
  capitalInvested: number | null;
  currentValue: number | null;
  roiPercent: number | null;
  acquisitionDate: string | null;
  holdPeriodDays: number | null;
}

export interface PortfolioAllocation {
  dealId: string;
  dealName: string;
  value: number;
}

export interface DealsMetrics {
  top5: TopDeal[];
  rollups: DealRollups;
  portfolioByDeal: PortfolioAllocation[];
}

export interface InvestorStatusCounts {
  active: number;
  onboarding: number;
  prospect: number;
  inactive: number;
}

export interface TopInvestor {
  id: string;
  name: string;
  capitalCommitted: number;
  capitalCalled: number;
}

export interface InvestorsMetrics {
  statusCounts: InvestorStatusCounts;
  top5: TopInvestor[];
  totalCount: number;
}

export interface DashboardMetrics {
  fundKpis: FundKpis;
  deals: DealsMetrics;
  investors: InvestorsMetrics;
}

// --- API ---

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get<{ success: boolean; data: DashboardMetrics }>(
      '/dashboard/metrics'
    );
    return response.data;
  },
};

