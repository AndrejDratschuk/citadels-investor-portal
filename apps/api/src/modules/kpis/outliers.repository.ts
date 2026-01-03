/**
 * Outliers Repository (Infrastructure Layer)
 * Handles all Supabase data access for KPI outlier configuration
 */

import { supabaseAdmin } from '../../common/database/supabase';
import type {
  KpiOutlierConfig,
  OutlierComparisonBaseline,
} from '@altsui/shared';

// ============================================
// Database Row Type (snake_case)
// ============================================
interface KpiOutlierConfigRow {
  id: string;
  fund_id: string;
  kpi_id: string;
  alert_threshold: number;
  comparison_baseline: string;
  green_threshold: number;
  red_threshold: number;
  is_inverse_metric: boolean;
  enabled_in_outliers: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Repository Class
// ============================================
export class OutliersRepository {
  /**
   * Get all outlier configs for a fund
   */
  async getConfigsByFundId(fundId: string): Promise<KpiOutlierConfig[]> {
    const { data, error } = await supabaseAdmin
      .from('kpi_outlier_config')
      .select('*')
      .eq('fund_id', fundId);

    if (error) {
      console.error('Error fetching outlier configs:', error);
      throw new Error('Failed to fetch outlier configurations');
    }

    return (data || []).map(this.formatConfig);
  }

  /**
   * Get outlier config for a specific KPI in a fund
   */
  async getConfigByKpiId(
    fundId: string,
    kpiId: string
  ): Promise<KpiOutlierConfig | null> {
    const { data, error } = await supabaseAdmin
      .from('kpi_outlier_config')
      .select('*')
      .eq('fund_id', fundId)
      .eq('kpi_id', kpiId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching outlier config:', error);
      throw new Error('Failed to fetch outlier configuration');
    }

    return data ? this.formatConfig(data) : null;
  }

  /**
   * Create or update outlier config for a KPI
   */
  async upsertConfig(
    fundId: string,
    kpiId: string,
    updates: Partial<{
      alertThreshold: number;
      comparisonBaseline: OutlierComparisonBaseline;
      greenThreshold: number;
      redThreshold: number;
      isInverseMetric: boolean;
      enabledInOutliers: boolean;
    }>
  ): Promise<KpiOutlierConfig> {
    const updateData: Record<string, unknown> = {
      fund_id: fundId,
      kpi_id: kpiId,
    };

    if (updates.alertThreshold !== undefined) {
      updateData.alert_threshold = updates.alertThreshold;
    }
    if (updates.comparisonBaseline !== undefined) {
      updateData.comparison_baseline = updates.comparisonBaseline;
    }
    if (updates.greenThreshold !== undefined) {
      updateData.green_threshold = updates.greenThreshold;
    }
    if (updates.redThreshold !== undefined) {
      updateData.red_threshold = updates.redThreshold;
    }
    if (updates.isInverseMetric !== undefined) {
      updateData.is_inverse_metric = updates.isInverseMetric;
    }
    if (updates.enabledInOutliers !== undefined) {
      updateData.enabled_in_outliers = updates.enabledInOutliers;
    }

    const { data, error } = await supabaseAdmin
      .from('kpi_outlier_config')
      .upsert(updateData, { onConflict: 'fund_id,kpi_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting outlier config:', error);
      throw new Error('Failed to update outlier configuration');
    }

    return this.formatConfig(data);
  }

  /**
   * Bulk update outlier configs for multiple KPIs
   */
  async bulkUpsertConfigs(
    fundId: string,
    configs: Array<{
      kpiId: string;
      alertThreshold?: number;
      comparisonBaseline?: OutlierComparisonBaseline;
      greenThreshold?: number;
      redThreshold?: number;
      isInverseMetric?: boolean;
      enabledInOutliers?: boolean;
    }>
  ): Promise<KpiOutlierConfig[]> {
    const results: KpiOutlierConfig[] = [];

    for (const config of configs) {
      const result = await this.upsertConfig(fundId, config.kpiId, {
        alertThreshold: config.alertThreshold,
        comparisonBaseline: config.comparisonBaseline,
        greenThreshold: config.greenThreshold,
        redThreshold: config.redThreshold,
        isInverseMetric: config.isInverseMetric,
        enabledInOutliers: config.enabledInOutliers,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Delete outlier config for a KPI (revert to defaults)
   */
  async deleteConfig(fundId: string, kpiId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('kpi_outlier_config')
      .delete()
      .eq('fund_id', fundId)
      .eq('kpi_id', kpiId);

    if (error) {
      console.error('Error deleting outlier config:', error);
      throw new Error('Failed to delete outlier configuration');
    }
  }

  // ============================================
  // Formatting Helper
  // ============================================
  private formatConfig(row: KpiOutlierConfigRow): KpiOutlierConfig {
    return {
      id: row.id,
      fundId: row.fund_id,
      kpiId: row.kpi_id,
      alertThreshold: Number(row.alert_threshold),
      comparisonBaseline: row.comparison_baseline as OutlierComparisonBaseline,
      greenThreshold: Number(row.green_threshold),
      redThreshold: Number(row.red_threshold),
      isInverseMetric: row.is_inverse_metric,
      enabledInOutliers: row.enabled_in_outliers,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const outliersRepository = new OutliersRepository();

