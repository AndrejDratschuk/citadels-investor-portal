-- KPI Outlier Configuration Table
-- Migration: 030_kpi_outlier_config.sql
-- Purpose: Store per-fund, per-KPI outlier detection thresholds and settings

-- ============================================
-- 1. Create kpi_outlier_config table
-- ============================================
CREATE TABLE kpi_outlier_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  
  -- Threshold settings
  alert_threshold DECIMAL(5,2) DEFAULT 20.0,
  comparison_baseline TEXT DEFAULT 'forecast' 
    CHECK (comparison_baseline IN ('forecast', 'budget', 'last_period')),
  
  -- Color thresholds
  green_threshold DECIMAL(5,2) DEFAULT 20.0,
  red_threshold DECIMAL(5,2) DEFAULT 20.0,
  
  -- Metric behavior
  is_inverse_metric BOOLEAN DEFAULT FALSE,
  enabled_in_outliers BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique config per fund-kpi pair
  UNIQUE(fund_id, kpi_id)
);

-- ============================================
-- 2. Indexes for Performance
-- ============================================
CREATE INDEX idx_kpi_outlier_config_fund_id ON kpi_outlier_config(fund_id);
CREATE INDEX idx_kpi_outlier_config_kpi_id ON kpi_outlier_config(kpi_id);
CREATE INDEX idx_kpi_outlier_config_enabled ON kpi_outlier_config(fund_id, enabled_in_outliers) 
  WHERE enabled_in_outliers = TRUE;

-- ============================================
-- 3. Trigger for updated_at
-- ============================================
CREATE TRIGGER update_kpi_outlier_config_updated_at 
  BEFORE UPDATE ON kpi_outlier_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS Policies
-- ============================================
ALTER TABLE kpi_outlier_config ENABLE ROW LEVEL SECURITY;

-- Managers can view their fund's outlier config
CREATE POLICY "Users can view fund outlier config" ON kpi_outlier_config
  FOR SELECT USING (fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid()));

-- Only managers can manage outlier config
CREATE POLICY "Managers can manage outlier config" ON kpi_outlier_config
  FOR ALL USING (fund_id IN (
    SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
  ));

-- ============================================
-- 5. Seed default inverse metrics
-- ============================================
-- These KPIs are "inverse" - lower actual vs baseline is GOOD (green)
-- Operating expenses, vacancy rate, loss to lease, concessions, etc.

-- Insert default inverse metric flags for common expense/negative KPIs
-- This runs after fund managers create their first outlier config
COMMENT ON TABLE kpi_outlier_config IS 
  'Per-fund KPI outlier detection configuration. Inverse metrics: operating_expense_ratio, vacancy_rate, loss_to_lease, concessions, total_expenses, expense_per_unit, ltv, avg_days_vacant, move_outs';

