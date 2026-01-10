/**
 * Dashboard Repository (Data Access Layer)
 * Simple data fetching with no business logic - following CODE_GUIDELINES.md
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  DealSummary,
  InvestorSummary,
  CapitalCallSummary,
  KpiDataSummary,
} from './dashboard.types';

// ============================================
// Repository Class
// ============================================

export class DashboardRepository {
  async getDealsByFundId(fundId: string): Promise<DealSummary[]> {
    const { data, error } = await supabaseAdmin
      .from('deals')
      .select('id, name, current_value, status')
      .eq('fund_id', fundId);

    if (error) {
      console.error('Error fetching deals for dashboard:', error);
      throw new Error('Failed to fetch deals');
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      currentValue: row.current_value,
      status: row.status,
    }));
  }

  async getInvestorsByFundId(fundId: string): Promise<InvestorSummary[]> {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, status, commitment_amount')
      .eq('fund_id', fundId);

    if (error) {
      console.error('Error fetching investors for dashboard:', error);
      throw new Error('Failed to fetch investors');
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      status: row.status ?? 'unknown',
      commitmentAmount: row.commitment_amount ?? 0,
    }));
  }

  async getCapitalCallsByFundId(fundId: string): Promise<CapitalCallSummary[]> {
    // First get capital calls with deals
    const { data, error } = await supabaseAdmin
      .from('capital_calls')
      .select(`
        id,
        deal_id,
        total_amount,
        status,
        deadline,
        deals!inner(name, fund_id)
      `)
      .eq('deals.fund_id', fundId);

    if (error) {
      console.error('Error fetching capital calls for dashboard:', error);
      throw new Error('Failed to fetch capital calls');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get received amounts from capital_call_items
    const capitalCallIds = data.map((cc) => cc.id);
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('capital_call_items')
      .select('capital_call_id, amount_received')
      .in('capital_call_id', capitalCallIds);

    if (itemsError) {
      console.error('Error fetching capital call items:', itemsError);
      throw new Error('Failed to fetch capital call items');
    }

    // Calculate total received per capital call
    const receivedByCall = new Map<string, number>();
    for (const item of itemsData ?? []) {
      const current = receivedByCall.get(item.capital_call_id) ?? 0;
      receivedByCall.set(item.capital_call_id, current + (item.amount_received ?? 0));
    }

    return data.map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      dealName: row.deals?.name ?? 'Unknown Deal',
      totalAmount: row.total_amount ?? 0,
      receivedAmount: receivedByCall.get(row.id) ?? 0,
      status: row.status ?? 'pending',
      dueDate: row.deadline,
    }));
  }

  async getLatestKpiDataByFundId(fundId: string): Promise<KpiDataSummary[]> {
    // First get all deal IDs for this fund
    const { data: deals, error: dealsError } = await supabaseAdmin
      .from('deals')
      .select('id')
      .eq('fund_id', fundId);

    if (dealsError) {
      console.error('Error fetching deal IDs for KPI data:', dealsError);
      throw new Error('Failed to fetch deal IDs');
    }

    if (!deals || deals.length === 0) {
      return [];
    }

    const dealIds = deals.map((d) => d.id);

    // Get latest KPI data for these deals with definitions
    const { data, error } = await supabaseAdmin
      .from('kpi_data')
      .select(`
        kpi_id,
        value,
        period_date,
        kpi_definitions!inner(code, name)
      `)
      .in('deal_id', dealIds)
      .eq('data_type', 'actual')
      .order('period_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching KPI data for dashboard:', error);
      throw new Error('Failed to fetch KPI data');
    }

    // Deduplicate by KPI code (keep latest)
    const kpiMap = new Map<string, KpiDataSummary>();

    for (const row of data ?? []) {
      const def = row.kpi_definitions as any;
      const code = def?.code;
      
      if (code && !kpiMap.has(code)) {
        kpiMap.set(code, {
          kpiId: row.kpi_id,
          kpiCode: code,
          kpiName: def?.name ?? code,
          value: row.value,
          periodDate: row.period_date,
          previousValue: null, // Would need separate query for previous period
        });
      }
    }

    return Array.from(kpiMap.values());
  }
}

export const dashboardRepository = new DashboardRepository();

