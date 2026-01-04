import { supabaseAdmin } from '../../common/database/supabase';
import { calculateFundMetrics } from './calculateFundMetrics';
import { calculateDealRollup } from './calculateDealRollup';
import type {
  FundMetrics,
  DealRollup,
  DealSummary,
  DealDbRow,
  InvestorDbRow,
} from './reports.types';

// Re-export types for convenience
export type { FundMetrics, DealRollup, DealSummary };

export class ReportsService {
  /**
   * Get fund-level metrics
   * Fetches data and delegates calculation to pure function
   */
  async getFundMetrics(fundId: string): Promise<FundMetrics> {
    const [deals, investors] = await Promise.all([
      this.fetchDealsForMetrics(fundId),
      this.fetchInvestorsForMetrics(fundId),
    ]);

    return calculateFundMetrics(deals, investors);
  }

  /**
   * Get deal summaries for the deal selector UI
   */
  async getDealSummaries(fundId: string): Promise<DealSummary[]> {
    const deals = await this.fetchDealSummaries(fundId);
    return deals.map(formatDealSummary);
  }

  /**
   * Get aggregated deal rollups
   * Fetches data and delegates calculation to pure function
   */
  async getDealRollups(fundId: string, dealIds?: string[]): Promise<DealRollup> {
    const deals = await this.fetchDealsForRollup(fundId, dealIds);
    return calculateDealRollup(deals);
  }

  // ============================================
  // Data Fetching (Infrastructure Layer)
  // ============================================

  private async fetchDealsForMetrics(fundId: string): Promise<DealDbRow[]> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('id, current_value, status, name, property_type, acquisition_price, unit_count, square_footage, kpis')
      .eq('fund_id', fundId);

    if (error) {
      throw new Error(`Failed to fetch deals: ${error.message}`);
    }

    return (data ?? []) as DealDbRow[];
  }

  private async fetchInvestorsForMetrics(fundId: string): Promise<InvestorDbRow[]> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, commitment_amount, total_invested, status')
      .eq('fund_id', fundId);

    if (error) {
      throw new Error(`Failed to fetch investors: ${error.message}`);
    }

    return (data ?? []) as InvestorDbRow[];
  }

  private async fetchDealSummaries(fundId: string): Promise<DealDbRow[]> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('id, name, status, current_value, acquisition_price, unit_count, property_type, square_footage, kpis')
      .eq('fund_id', fundId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch deal summaries: ${error.message}`);
    }

    return (data ?? []) as DealDbRow[];
  }

  private async fetchDealsForRollup(fundId: string, dealIds?: string[]): Promise<DealDbRow[]> {
    // Only select columns needed for calculation (optimized query)
    let query = supabaseAdmin
      .from('deals')
      .select('id, name, status, property_type, current_value, acquisition_price, unit_count, square_footage, kpis')
      .eq('fund_id', fundId);

    if (dealIds && dealIds.length > 0) {
      query = query.in('id', dealIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch deals for rollup: ${error.message}`);
    }

    return (data ?? []) as DealDbRow[];
  }
}

function formatDealSummary(deal: DealDbRow): DealSummary {
  return {
    id: deal.id,
    name: deal.name,
    status: deal.status,
    currentValue: deal.current_value ? parseFloat(deal.current_value) : null,
    acquisitionPrice: deal.acquisition_price ? parseFloat(deal.acquisition_price) : null,
    unitCount: deal.unit_count,
    propertyType: deal.property_type,
  };
}

export const reportsService = new ReportsService();
