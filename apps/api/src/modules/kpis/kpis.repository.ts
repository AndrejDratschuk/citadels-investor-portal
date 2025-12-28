/**
 * KPI Repository (Adapter Layer)
 * Handles all Supabase data access for KPIs
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  KpiDefinition,
  KpiPreference,
  KpiDataPoint,
  KpiCategory,
  KpiDataType,
  KpiPeriodType,
  FinancialStatement,
  StatementType,
} from '@altsui/shared';

// ============================================
// Database Row Types (snake_case)
// ============================================
interface KpiDefinitionRow {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  format: string;
  formula: string | null;
  sort_order: number;
  created_at: string;
}

interface KpiPreferenceRow {
  id: string;
  fund_id: string;
  kpi_id: string;
  is_featured: boolean;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface KpiDataRow {
  id: string;
  deal_id: string;
  kpi_id: string;
  period_type: string;
  period_date: string;
  data_type: string;
  value: number;
  source: string;
  source_ref: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface FinancialStatementRow {
  id: string;
  deal_id: string;
  statement_type: string;
  period_date: string;
  data: Record<string, unknown>;
  source: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ============================================
// Repository Class
// ============================================
export class KpisRepository {
  // ========== KPI Definitions ==========

  async getAllDefinitions(): Promise<KpiDefinition[]> {
    const { data, error } = await supabaseAdmin
      .from('kpi_definitions')
      .select('*')
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('Error fetching KPI definitions:', error);
      throw new Error('Failed to fetch KPI definitions');
    }

    return data.map(this.formatDefinition);
  }

  async getDefinitionsByCategory(category: KpiCategory): Promise<KpiDefinition[]> {
    const { data, error } = await supabaseAdmin
      .from('kpi_definitions')
      .select('*')
      .eq('category', category)
      .order('sort_order');

    if (error) {
      console.error('Error fetching KPI definitions by category:', error);
      throw new Error('Failed to fetch KPI definitions');
    }

    return data.map(this.formatDefinition);
  }

  async getDefinitionByCode(code: string): Promise<KpiDefinition | null> {
    const { data, error } = await supabaseAdmin
      .from('kpi_definitions')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatDefinition(data);
  }

  async getDefinitionById(id: string): Promise<KpiDefinition | null> {
    const { data, error } = await supabaseAdmin
      .from('kpi_definitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatDefinition(data);
  }

  // ========== KPI Preferences ==========

  async getPreferencesByFundId(fundId: string): Promise<KpiPreference[]> {
    const { data, error } = await supabaseAdmin
      .from('kpi_preferences')
      .select('*')
      .eq('fund_id', fundId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching KPI preferences:', error);
      throw new Error('Failed to fetch KPI preferences');
    }

    return data.map(this.formatPreference);
  }

  async getFeaturedPreferences(fundId: string): Promise<KpiPreference[]> {
    const { data, error } = await supabaseAdmin
      .from('kpi_preferences')
      .select('*')
      .eq('fund_id', fundId)
      .eq('is_featured', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching featured preferences:', error);
      throw new Error('Failed to fetch featured preferences');
    }

    return data.map(this.formatPreference);
  }

  async upsertPreference(
    fundId: string,
    kpiId: string,
    updates: Partial<{
      isFeatured: boolean;
      isEnabled: boolean;
      sortOrder: number;
    }>
  ): Promise<KpiPreference> {
    const updateData: Record<string, unknown> = {
      fund_id: fundId,
      kpi_id: kpiId,
    };

    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

    const { data, error } = await supabaseAdmin
      .from('kpi_preferences')
      .upsert(updateData, { onConflict: 'fund_id,kpi_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting KPI preference:', error);
      throw new Error('Failed to update KPI preference');
    }

    return this.formatPreference(data);
  }

  // ========== KPI Data ==========

  async getKpiDataByDeal(
    dealId: string,
    options?: {
      category?: KpiCategory;
      dataType?: KpiDataType;
      periodType?: KpiPeriodType;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<KpiDataPoint[]> {
    let query = supabaseAdmin
      .from('kpi_data')
      .select('*')
      .eq('deal_id', dealId);

    if (options?.dataType) {
      query = query.eq('data_type', options.dataType);
    }
    if (options?.periodType) {
      query = query.eq('period_type', options.periodType);
    }
    if (options?.startDate) {
      query = query.gte('period_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('period_date', options.endDate);
    }

    query = query.order('period_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching KPI data:', error);
      throw new Error('Failed to fetch KPI data');
    }

    // Filter by category if specified (requires join with definitions)
    if (options?.category) {
      const definitions = await this.getDefinitionsByCategory(options.category);
      const categoryKpiIds = new Set(definitions.map(d => d.id));
      return data.filter((row: KpiDataRow) => categoryKpiIds.has(row.kpi_id)).map(this.formatKpiData);
    }

    return data.map(this.formatKpiData);
  }

  async getLatestKpiData(
    dealId: string,
    kpiId: string,
    dataType: KpiDataType = 'actual'
  ): Promise<KpiDataPoint | null> {
    const { data, error } = await supabaseAdmin
      .from('kpi_data')
      .select('*')
      .eq('deal_id', dealId)
      .eq('kpi_id', kpiId)
      .eq('data_type', dataType)
      .order('period_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatKpiData(data);
  }

  async upsertKpiData(
    dealId: string,
    kpiId: string,
    input: {
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
      sourceRef?: string;
      createdBy?: string;
    }
  ): Promise<KpiDataPoint> {
    const { data, error } = await supabaseAdmin
      .from('kpi_data')
      .upsert(
        {
          deal_id: dealId,
          kpi_id: kpiId,
          period_type: input.periodType,
          period_date: input.periodDate,
          data_type: input.dataType,
          value: input.value,
          source: input.source || 'manual',
          source_ref: input.sourceRef || null,
          created_by: input.createdBy || null,
          imported_at: input.source !== 'manual' ? new Date().toISOString() : null,
        },
        { onConflict: 'deal_id,kpi_id,period_type,period_date,data_type' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting KPI data:', error);
      throw new Error('Failed to save KPI data');
    }

    return this.formatKpiData(data);
  }

  async bulkUpsertKpiData(
    dealId: string,
    dataPoints: Array<{
      kpiId: string;
      periodType: KpiPeriodType;
      periodDate: string;
      dataType: KpiDataType;
      value: number;
      source?: string;
      sourceRef?: string;
      createdBy?: string;
    }>
  ): Promise<KpiDataPoint[]> {
    const rows = dataPoints.map(point => ({
      deal_id: dealId,
      kpi_id: point.kpiId,
      period_type: point.periodType,
      period_date: point.periodDate,
      data_type: point.dataType,
      value: point.value,
      source: point.source || 'manual',
      source_ref: point.sourceRef || null,
      created_by: point.createdBy || null,
      imported_at: point.source !== 'manual' ? new Date().toISOString() : null,
    }));

    const { data, error } = await supabaseAdmin
      .from('kpi_data')
      .upsert(rows, { onConflict: 'deal_id,kpi_id,period_type,period_date,data_type' })
      .select();

    if (error) {
      console.error('Error bulk upserting KPI data:', error);
      throw new Error('Failed to save KPI data');
    }

    return data.map(this.formatKpiData);
  }

  async deleteKpiData(dealId: string, kpiDataId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('kpi_data')
      .delete()
      .eq('id', kpiDataId)
      .eq('deal_id', dealId);

    if (error) {
      console.error('Error deleting KPI data:', error);
      throw new Error('Failed to delete KPI data');
    }
  }

  // ========== Financial Statements ==========

  async getFinancialStatements(
    dealId: string,
    statementType?: StatementType
  ): Promise<FinancialStatement[]> {
    let query = supabaseAdmin
      .from('financial_statements')
      .select('*')
      .eq('deal_id', dealId)
      .order('period_date', { ascending: false });

    if (statementType) {
      query = query.eq('statement_type', statementType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financial statements:', error);
      throw new Error('Failed to fetch financial statements');
    }

    return data.map(this.formatFinancialStatement);
  }

  async getLatestFinancialStatement(
    dealId: string,
    statementType: StatementType
  ): Promise<FinancialStatement | null> {
    const { data, error } = await supabaseAdmin
      .from('financial_statements')
      .select('*')
      .eq('deal_id', dealId)
      .eq('statement_type', statementType)
      .order('period_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.formatFinancialStatement(data);
  }

  async upsertFinancialStatement(
    dealId: string,
    input: {
      statementType: StatementType;
      periodDate: string;
      data: Record<string, unknown>;
      source?: string;
      createdBy?: string;
    }
  ): Promise<FinancialStatement> {
    const { data, error } = await supabaseAdmin
      .from('financial_statements')
      .upsert(
        {
          deal_id: dealId,
          statement_type: input.statementType,
          period_date: input.periodDate,
          data: input.data,
          source: input.source || 'manual',
          created_by: input.createdBy || null,
        },
        { onConflict: 'deal_id,statement_type,period_date' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting financial statement:', error);
      throw new Error('Failed to save financial statement');
    }

    return this.formatFinancialStatement(data);
  }

  // ========== Formatting Helpers ==========

  private formatDefinition(row: KpiDefinitionRow): KpiDefinition {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      category: row.category as KpiCategory,
      description: row.description,
      format: row.format as KpiDefinition['format'],
      formula: row.formula,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }

  private formatPreference(row: KpiPreferenceRow): KpiPreference {
    return {
      id: row.id,
      fundId: row.fund_id,
      kpiId: row.kpi_id,
      isFeatured: row.is_featured,
      isEnabled: row.is_enabled,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private formatKpiData(row: KpiDataRow): KpiDataPoint {
    return {
      id: row.id,
      dealId: row.deal_id,
      kpiId: row.kpi_id,
      periodType: row.period_type as KpiPeriodType,
      periodDate: row.period_date,
      dataType: row.data_type as KpiDataType,
      value: row.value,
      source: row.source as KpiDataPoint['source'],
      sourceRef: row.source_ref,
      importedAt: row.imported_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    };
  }

  private formatFinancialStatement(row: FinancialStatementRow): FinancialStatement {
    return {
      id: row.id,
      dealId: row.deal_id,
      statementType: row.statement_type as StatementType,
      periodDate: row.period_date,
      data: row.data as FinancialStatement['data'],
      source: row.source as FinancialStatement['source'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    };
  }
}

export const kpisRepository = new KpisRepository();

