-- Stakeholder Type Permissions Migration
-- Expands investor_type_permissions to stakeholder_type_permissions
-- Adds stakeholder_type field to users table
-- Clean break: removes old function, creates new one

-- ============================================
-- 1. Rename table and column
-- ============================================

ALTER TABLE investor_type_permissions RENAME TO stakeholder_type_permissions;
ALTER TABLE stakeholder_type_permissions RENAME COLUMN investor_type TO stakeholder_type;

-- ============================================
-- 2. Drop old constraint and add new one with expanded types
-- ============================================

-- First check if the constraint exists on the investors table and drop it
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investors_type_check') THEN
    ALTER TABLE investors DROP CONSTRAINT investors_type_check;
  END IF;
END $$;

-- Add new constraint with all stakeholder types
ALTER TABLE investors ADD CONSTRAINT investors_stakeholder_type_check 
  CHECK (investor_type IN (
    'limited_partner',
    'general_partner', 
    'series_a',
    'series_b',
    'series_c',
    'institutional',
    'individual_accredited',
    'family_office',
    'accountant',
    'attorney',
    'property_manager',
    'team_member',
    'custom'
  ));

-- ============================================
-- 3. Add stakeholder_type column to users table
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS stakeholder_type TEXT;

-- Add CHECK constraint for valid stakeholder types on users table
ALTER TABLE users ADD CONSTRAINT users_stakeholder_type_check 
  CHECK (stakeholder_type IS NULL OR stakeholder_type IN (
    'limited_partner',
    'general_partner', 
    'series_a',
    'series_b',
    'series_c',
    'institutional',
    'individual_accredited',
    'family_office',
    'accountant',
    'attorney',
    'property_manager',
    'team_member',
    'custom'
  ));

-- Index for filtering by stakeholder type
CREATE INDEX IF NOT EXISTS idx_users_stakeholder_type ON users(stakeholder_type);

-- ============================================
-- 4. Update indexes on renamed table
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_investor_type_permissions_fund;
DROP INDEX IF EXISTS idx_investor_type_permissions_type;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_stakeholder_type_permissions_fund ON stakeholder_type_permissions(fund_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_type_permissions_type ON stakeholder_type_permissions(fund_id, stakeholder_type);

-- ============================================
-- 5. Drop old seed function, create new one
-- ============================================

DROP FUNCTION IF EXISTS seed_investor_type_permissions(UUID);

CREATE OR REPLACE FUNCTION seed_stakeholder_type_permissions(p_fund_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Investors: Limited Partner (LP) - Restricted view
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'limited_partner', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: General Partner (GP) - Enhanced view
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'general_partner', true, true, false, 'detailed')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Series A
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'series_a', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Series B
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'series_b', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Series C
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'series_c', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Institutional - Enhanced view like GP
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'institutional', true, true, false, 'detailed')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Individual Accredited
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'individual_accredited', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Investors: Family Office - Enhanced view
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'family_office', true, true, false, 'detailed')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Service Providers: Accountant - Full financials, no pipeline
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, can_view_fund_documents, can_view_deal_documents, kpi_detail_level)
  VALUES (p_fund_id, 'accountant', true, false, false, true, true, 'full')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Service Providers: Attorney - Documents only, no financials
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, can_view_fund_documents, can_view_deal_documents, kpi_detail_level)
  VALUES (p_fund_id, 'attorney', false, false, false, true, true, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Service Providers: Property Manager - Deal docs, detailed KPIs
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, can_view_fund_documents, can_view_deal_documents, kpi_detail_level)
  VALUES (p_fund_id, 'property_manager', false, false, false, true, true, 'detailed')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Team: Team Member - Full access
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, can_view_fund_documents, can_view_deal_documents, can_view_other_investors, can_view_all_communications, kpi_detail_level)
  VALUES (p_fund_id, 'team_member', true, true, true, true, true, true, true, 'full')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  
  -- Custom - Minimal defaults, fund manager configures
  INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, kpi_detail_level)
  VALUES (p_fund_id, 'custom', false, false, false, 'summary')
  ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Seed new stakeholder types for existing funds
-- ============================================

DO $$
DECLARE
  fund_record RECORD;
BEGIN
  FOR fund_record IN SELECT id FROM funds LOOP
    -- Insert new stakeholder types (existing investor types already exist)
    INSERT INTO stakeholder_type_permissions (fund_id, stakeholder_type, can_view_detailed_financials, can_view_outliers, can_view_pipeline, can_view_fund_documents, can_view_deal_documents, kpi_detail_level)
    VALUES 
      (fund_record.id, 'accountant', true, false, false, true, true, 'full'),
      (fund_record.id, 'attorney', false, false, false, true, true, 'summary'),
      (fund_record.id, 'property_manager', false, false, false, true, true, 'detailed'),
      (fund_record.id, 'team_member', true, true, true, true, true, 'full')
    ON CONFLICT (fund_id, stakeholder_type) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 7. Update RLS Policies
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS investor_type_permissions_manager_select ON stakeholder_type_permissions;
DROP POLICY IF EXISTS investor_type_permissions_manager_insert ON stakeholder_type_permissions;
DROP POLICY IF EXISTS investor_type_permissions_manager_update ON stakeholder_type_permissions;
DROP POLICY IF EXISTS investor_type_permissions_manager_delete ON stakeholder_type_permissions;
DROP POLICY IF EXISTS investor_type_permissions_investor_select ON stakeholder_type_permissions;

-- Create new policies for stakeholder_type_permissions
CREATE POLICY stakeholder_type_permissions_manager_select ON stakeholder_type_permissions
  FOR SELECT
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY stakeholder_type_permissions_manager_insert ON stakeholder_type_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY stakeholder_type_permissions_manager_update ON stakeholder_type_permissions
  FOR UPDATE
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY stakeholder_type_permissions_manager_delete ON stakeholder_type_permissions
  FOR DELETE
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Stakeholders can view their own type's permissions (for UI filtering)
CREATE POLICY stakeholder_type_permissions_user_select ON stakeholder_type_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = stakeholder_type_permissions.fund_id
        AND u.stakeholder_type = stakeholder_type_permissions.stakeholder_type
    )
    OR
    EXISTS (
      SELECT 1 FROM investors i
      JOIN users u ON u.id = auth.uid()
      WHERE i.user_id = u.id
        AND i.fund_id = stakeholder_type_permissions.fund_id
        AND i.investor_type = stakeholder_type_permissions.stakeholder_type
    )
  );

-- ============================================
-- 8. Rename trigger if it exists
-- ============================================

DROP TRIGGER IF EXISTS update_investor_type_permissions_updated_at ON stakeholder_type_permissions;

CREATE TRIGGER update_stakeholder_type_permissions_updated_at 
  BEFORE UPDATE ON stakeholder_type_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

