/**
 * Dashboard Service
 * Orchestrator: fetches data, applies calculations, handles errors
 */

import { supabaseAdmin } from '../../common/database/supabase.js';
import type { DashboardMetrics, DealsMetrics, InvestorsMetrics, FundKpis } from './dashboard.types.js';
import {
  buildFundKpis,
  buildDealRollups,
  buildTopDeal,
  buildPortfolioAllocation,
  buildInvestorStatusCounts,
  buildTopInvestor,
} from './dashboard.calculations.js';

export class DashboardService {
  /**
   * Get all dashboard metrics for a fund
   * Single aggregation point - orchestrates all data fetching
   */
  async getMetrics(fundId: string, currentDate: Date): Promise<DashboardMetrics> {
    const [fundKpis, deals, investors] = await Promise.all([
      this.fetchFundKpis(fundId),
      this.fetchDealsMetrics(fundId, currentDate),
      this.fetchInvestorsMetrics(fundId),
    ]);

    return { fundKpis, deals, investors };
  }

  private async fetchFundKpis(fundId: string): Promise<FundKpis> {
    // Fetch aggregates in parallel
    const [dealsAgg, investorsAgg, capitalCallsAgg] = await Promise.all([
      this.aggregateDeals(fundId),
      this.aggregateInvestors(fundId),
      this.aggregateCapitalCalls(fundId),
    ]);

    return buildFundKpis({
      totalAum: dealsAgg.totalAum,
      committedCapital: investorsAgg.totalCommitted,
      capitalCalled: investorsAgg.totalCalled,
      capitalDeployed: dealsAgg.totalDeployed,
      debtOutstanding: dealsAgg.totalDebt,
    });
  }

  private async aggregateDeals(fundId: string): Promise<{
    totalAum: number | null;
    totalDeployed: number | null;
    totalDebt: number | null;
  }> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('current_value, acquisition_price, debt_amount')
      .eq('fund_id', fundId);

    if (error) {
      console.error('[DashboardService] aggregateDeals error:', error);
      return { totalAum: null, totalDeployed: null, totalDebt: null };
    }

    if (!data || data.length === 0) {
      return { totalAum: 0, totalDeployed: 0, totalDebt: 0 };
    }

    let totalAum = 0;
    let totalDeployed = 0;
    let totalDebt = 0;

    for (const deal of data) {
      totalAum += Number(deal.current_value) || 0;
      totalDeployed += Number(deal.acquisition_price) || 0;
      totalDebt += Number(deal.debt_amount) || 0;
    }

    return { totalAum, totalDeployed, totalDebt };
  }

  private async aggregateInvestors(fundId: string): Promise<{
    totalCommitted: number | null;
    totalCalled: number | null;
  }> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('commitment_amount, total_called')
      .eq('fund_id', fundId);

    if (error) {
      console.error('[DashboardService] aggregateInvestors error:', error);
      return { totalCommitted: null, totalCalled: null };
    }

    if (!data || data.length === 0) {
      return { totalCommitted: 0, totalCalled: 0 };
    }

    let totalCommitted = 0;
    let totalCalled = 0;

    for (const inv of data) {
      totalCommitted += Number(inv.commitment_amount) || 0;
      totalCalled += Number(inv.total_called) || 0;
    }

    return { totalCommitted, totalCalled };
  }

  private async aggregateCapitalCalls(fundId: string): Promise<{
    totalCollected: number;
    totalOutstanding: number;
  }> {
    const { data, error } = await supabaseAdmin
      .from('capital_call_items')
      .select(`
        amount_due,
        amount_received,
        capital_calls!inner(fund_id)
      `)
      .eq('capital_calls.fund_id', fundId);

    if (error) {
      console.error('[DashboardService] aggregateCapitalCalls error:', error);
      return { totalCollected: 0, totalOutstanding: 0 };
    }

    if (!data || data.length === 0) {
      return { totalCollected: 0, totalOutstanding: 0 };
    }

    let totalCollected = 0;
    let totalOutstanding = 0;

    for (const item of data) {
      const received = Number(item.amount_received) || 0;
      const due = Number(item.amount_due) || 0;
      totalCollected += received;
      totalOutstanding += Math.max(0, due - received);
    }

    return { totalCollected, totalOutstanding };
  }

  private async fetchDealsMetrics(fundId: string, currentDate: Date): Promise<DealsMetrics> {
    const { data: deals, error } = await supabaseAdmin
      .from('deals')
      .select('id, name, acquisition_price, current_value, acquisition_date')
      .eq('fund_id', fundId)
      .order('acquisition_price', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[DashboardService] fetchDealsMetrics error:', error);
      return this.emptyDealsMetrics();
    }

    if (!deals || deals.length === 0) {
      return this.emptyDealsMetrics();
    }

    // Top 5 deals by capital invested
    const top5 = deals.slice(0, 5).map((d) =>
      buildTopDeal(
        {
          id: d.id,
          name: d.name,
          acquisitionPrice: d.acquisition_price ? Number(d.acquisition_price) : null,
          currentValue: d.current_value ? Number(d.current_value) : null,
          acquisitionDate: d.acquisition_date,
        },
        currentDate
      )
    );

    // Portfolio allocation
    const portfolioByDeal = buildPortfolioAllocation(
      deals.map((d) => ({
        id: d.id,
        name: d.name,
        currentValue: d.current_value ? Number(d.current_value) : null,
      }))
    );

    // Get rollups
    const [investorsAgg, capitalCallsAgg] = await Promise.all([
      this.aggregateInvestors(fundId),
      this.aggregateCapitalCalls(fundId),
    ]);

    let capitalInvested = 0;
    for (const d of deals) {
      capitalInvested += Number(d.acquisition_price) || 0;
    }

    const rollups = buildDealRollups({
      capitalInvested,
      capitalCollected: capitalCallsAgg.totalCollected,
      capitalOutstanding: capitalCallsAgg.totalOutstanding,
      committedCapital: investorsAgg.totalCommitted,
      capitalCalled: investorsAgg.totalCalled,
    });

    return { top5, rollups, portfolioByDeal };
  }

  private emptyDealsMetrics(): DealsMetrics {
    return {
      top5: [],
      rollups: {
        capitalInvested: 0,
        capitalCollected: 0,
        capitalOutstanding: 0,
        capitalReserves: 0,
      },
      portfolioByDeal: [],
    };
  }

  private async fetchInvestorsMetrics(fundId: string): Promise<InvestorsMetrics> {
    const { data: investors, error } = await supabaseAdmin
      .from('investors')
      .select('id, first_name, last_name, status, commitment_amount, total_called')
      .eq('fund_id', fundId);

    if (error) {
      console.error('[DashboardService] fetchInvestorsMetrics error:', error);
      return this.emptyInvestorsMetrics();
    }

    if (!investors || investors.length === 0) {
      return this.emptyInvestorsMetrics();
    }

    // Status counts
    const statusCounts = buildInvestorStatusCounts(investors);

    // Top 5 by commitment
    const sorted = [...investors].sort(
      (a, b) => (Number(b.commitment_amount) || 0) - (Number(a.commitment_amount) || 0)
    );

    const top5 = sorted.slice(0, 5).map((inv) =>
      buildTopInvestor({
        id: inv.id,
        firstName: inv.first_name,
        lastName: inv.last_name,
        commitmentAmount: inv.commitment_amount ? Number(inv.commitment_amount) : null,
        totalCalled: inv.total_called ? Number(inv.total_called) : null,
      })
    );

    return {
      statusCounts,
      top5,
      totalCount: investors.length,
    };
  }

  private emptyInvestorsMetrics(): InvestorsMetrics {
    return {
      statusCounts: { active: 0, onboarding: 0, prospect: 0, inactive: 0 },
      top5: [],
      totalCount: 0,
    };
  }
}

export const dashboardService = new DashboardService();

