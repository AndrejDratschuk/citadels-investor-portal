-- Investor Types & Permissions System
-- Adds investor_type field and fund-level permission configuration

-- ============================================
-- 1. Add investor_type column to investors table
-- ============================================

ALTER TABLE investors ADD COLUMN IF NOT EXISTS investor_type TEXT DEFAULT 'limited_partner';

-- Add CHECK constraint for valid investor types
ALTER TABLE investors ADD CONSTRAINT investors_type_check 
  CHECK (investor_type IN (
    'limited_partner',
    'general_partner', 
    'series_a',
    'series_b',
    'series_c',
    'institutional',
    'individual_accredited',
    'family_office',
    'custom'
  ));

-- Index for filtering by investor type
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(investor_type);

-- ============================================
-- 2. Create investor_type_permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS investor_type_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  investor_type TEXT NOT NULL,
  
  -- Dashboard access permissions
  can_view_detailed_financials BOOLEAN DEFAULT false,
  can_view_outliers BOOLEAN DEFAULT false,
  can_view_other_investors BOOLEAN DEFAULT false,
  can_view_pipeline BOOLEAN DEFAULT false,
  
  -- Document access permissions
  can_view_fund_documents BOOLEAN DEFAULT true,
  can_view_deal_documents BOOLEAN DEFAULT true,
  can_view_other_investor_docs BOOLEAN DEFAULT false,
  
  -- Communication access
  can_view_all_communications BOOLEAN DEFAULT false,
  
  -- KPI detail level: 'summary' | 'detailed' | 'full'
  kpi_detail_level TEXT DEFAULT 'summary' CHECK (kpi_detail_level IN ('summary', 'detailed', 'full')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each fund can only have one permission config per investor type
  UNIQUE(fund_id, investor_type)
);

-- Index for quick permission lookups
CREATE INDEX IF NOT EXISTS idx_investor_type_permissions_fund ON investor_type_permissions(fund_id);
CREATE INDEX IF NOT EXISTS idx_investor_type_permissions_type ON investor_type_permissions(fund_id, investor_type);

-- Trigger for updated_at
CREATE TRIGGER update_investor_type_permissions_updated_at 
  BEFORE UPDATE ON investor_type_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Seed default permissions for existing funds
-- ============================================

-- Function to seed default permissions for a fund
CREATE OR REPLACE FUNCTION seed_investor_type_permissions(p_fund_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Limited Partner (LP) - Restricted view
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'limited_partner', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- General Partner (GP) - Enhanced view
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'general_partner', true, true, 'detailed')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Series A - Similar to LP with summary view
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'series_a', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Series B - Similar to LP
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'series_b', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Series C - Similar to LP
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'series_c', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Institutional - Enhanced view like GP
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'institutional', true, true, 'detailed')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Individual Accredited - Summary view
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'individual_accredited', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Family Office - Enhanced view
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'family_office', true, true, 'detailed')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
  
  -- Custom - Default to summary (fund manager configures)
  INSERT INTO investor_type_permissions (fund_id, investor_type, can_view_detailed_financials, can_view_outliers, kpi_detail_level)
  VALUES (p_fund_id, 'custom', false, false, 'summary')
  ON CONFLICT (fund_id, investor_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed default permissions for all existing funds
DO $$
DECLARE
  fund_record RECORD;
BEGIN
  FOR fund_record IN SELECT id FROM funds LOOP
    PERFORM seed_investor_type_permissions(fund_record.id);
  END LOOP;
END $$;

-- ============================================
-- 4. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE investor_type_permissions ENABLE ROW LEVEL SECURITY;

-- Fund managers can view/edit their fund's permission configurations
CREATE POLICY investor_type_permissions_manager_select ON investor_type_permissions
  FOR SELECT
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY investor_type_permissions_manager_insert ON investor_type_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY investor_type_permissions_manager_update ON investor_type_permissions
  FOR UPDATE
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY investor_type_permissions_manager_delete ON investor_type_permissions
  FOR DELETE
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Investors can view their own type's permissions (for UI filtering)
CREATE POLICY investor_type_permissions_investor_select ON investor_type_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      JOIN users u ON u.id = auth.uid()
      WHERE i.user_id = u.id
        AND i.fund_id = investor_type_permissions.fund_id
        AND i.investor_type = investor_type_permissions.investor_type
    )
  );

