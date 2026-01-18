/**
 * Dashboard Service (Orchestrator)
 * Manages flow, handles errors, injects dependencies - following CODE_GUIDELINES.md
 */

import { dashboardRepository } from './dashboard.repository';
import { calculateFundStats } from './dashboardAggregations';
import type { FundDashboardStats } from './dashboard.types';

// ============================================
// Dependency Injection Interface
// ============================================

interface ServiceDeps {
  now: Date;
}

// ============================================
// Service Class (Orchestrator)
// ============================================

export class DashboardService {
  /**
   * Get aggregated fund dashboard statistics
   * Orchestrates data fetching and calls pure aggregation functions
   */
  async getFundStats(
    fundId: string,
    options: { includeKpis: boolean; kpiLimit: number },
    deps: ServiceDeps
  ): Promise<FundDashboardStats> {
    try {
      // Fetch raw data from repositories (parallel for performance)
      const [deals, investors, capitalCalls, kpiData] = await Promise.all([
        dashboardRepository.getDealsByFundId(fundId),
        dashboardRepository.getInvestorsByFundId(fundId),
        dashboardRepository.getCapitalCallsByFundId(fundId),
        options.includeKpis
          ? dashboardRepository.getLatestKpiDataByFundId(fundId)
          : Promise.resolve([]),
      ]);

      // Call pure function with injected Date
      return calculateFundStats(deals, investors, capitalCalls, kpiData, deps.now, {
        kpiLimit: options.kpiLimit,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}

export const dashboardService = new DashboardService();









