-- Granular Permission System Migration
-- Replaces flat boolean permissions with hierarchical path-based permissions
-- Supports custom roles, inheritance, and deal-level overrides

-- ============================================
-- 1. Create stakeholder_roles table
-- ============================================

CREATE TABLE stakeholder_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  role_name TEXT NOT NULL,
  role_type TEXT NOT NULL DEFAULT 'system' CHECK (role_type IN ('system', 'custom')),
  base_stakeholder_type TEXT, -- For custom roles based on existing types
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(fund_id, role_name)
);

-- Index for fund lookups
CREATE INDEX idx_stakeholder_roles_fund_id ON stakeholder_roles(fund_id);
CREATE INDEX idx_stakeholder_roles_type ON stakeholder_roles(fund_id, role_type);

-- ============================================
-- 2. Create role_permissions table
-- ============================================

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES stakeholder_roles(id) ON DELETE CASCADE NOT NULL,
  permission_path TEXT NOT NULL,
  permission_type TEXT NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'create', 'edit', 'delete')),
  is_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, permission_path, permission_type)
);

-- Indexes for permission lookups
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_path ON role_permissions(role_id, permission_path);
CREATE INDEX idx_role_permissions_lookup ON role_permissions(role_id, permission_path, permission_type);

-- ============================================
-- 3. Create deal_permission_overrides table
-- ============================================

CREATE TABLE deal_permission_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES stakeholder_roles(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  permission_path TEXT NOT NULL,
  permission_type TEXT NOT NULL DEFAULT 'view' CHECK (permission_type IN ('view', 'create', 'edit', 'delete')),
  is_granted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role_id, deal_id, permission_path, permission_type)
);

-- Indexes for override lookups
CREATE INDEX idx_deal_permission_overrides_role_deal ON deal_permission_overrides(role_id, deal_id);
CREATE INDEX idx_deal_permission_overrides_deal ON deal_permission_overrides(deal_id);

-- ============================================
-- 4. Add role_id column to users and investors tables
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES stakeholder_roles(id) ON DELETE SET NULL;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES stakeholder_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_investors_role_id ON investors(role_id);

-- ============================================
-- 5. Triggers for updated_at
-- ============================================

CREATE TRIGGER update_stakeholder_roles_updated_at 
  BEFORE UPDATE ON stakeholder_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at 
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS Policies
-- ============================================

ALTER TABLE stakeholder_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_permission_overrides ENABLE ROW LEVEL SECURITY;

-- stakeholder_roles policies
CREATE POLICY stakeholder_roles_manager_all ON stakeholder_roles
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY stakeholder_roles_user_select ON stakeholder_roles
  FOR SELECT
  TO authenticated
  USING (
    fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  );

-- role_permissions policies
CREATE POLICY role_permissions_manager_all ON role_permissions
  FOR ALL
  TO authenticated
  USING (
    role_id IN (
      SELECT sr.id FROM stakeholder_roles sr
      JOIN users u ON u.fund_id = sr.fund_id
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );

CREATE POLICY role_permissions_user_select ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT sr.id FROM stakeholder_roles sr
      JOIN users u ON u.fund_id = sr.fund_id
      WHERE u.id = auth.uid()
    )
  );

-- deal_permission_overrides policies
CREATE POLICY deal_permission_overrides_manager_all ON deal_permission_overrides
  FOR ALL
  TO authenticated
  USING (
    role_id IN (
      SELECT sr.id FROM stakeholder_roles sr
      JOIN users u ON u.fund_id = sr.fund_id
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );

CREATE POLICY deal_permission_overrides_user_select ON deal_permission_overrides
  FOR SELECT
  TO authenticated
  USING (
    role_id IN (
      SELECT sr.id FROM stakeholder_roles sr
      JOIN users u ON u.fund_id = sr.fund_id
      WHERE u.id = auth.uid()
    )
  );

-- ============================================
-- 7. Migration: Create system roles from existing stakeholder types
-- ============================================

-- Function to create system roles for a fund
CREATE OR REPLACE FUNCTION create_system_roles_for_fund(p_fund_id UUID)
RETURNS VOID AS $$
DECLARE
  stakeholder_types TEXT[] := ARRAY[
    'limited_partner', 'general_partner', 'series_a', 'series_b', 'series_c',
    'institutional', 'individual_accredited', 'family_office',
    'accountant', 'attorney', 'property_manager', 'team_member'
  ];
  role_labels TEXT[] := ARRAY[
    'Limited Partner (LP)', 'General Partner (GP)', 'Series A Investor', 'Series B Investor', 'Series C Investor',
    'Institutional Investor', 'Individual Accredited', 'Family Office',
    'Accountant', 'Attorney', 'Property Manager', 'Team Member'
  ];
  i INT;
BEGIN
  FOR i IN 1..array_length(stakeholder_types, 1) LOOP
    INSERT INTO stakeholder_roles (fund_id, role_name, role_type, base_stakeholder_type, is_default)
    VALUES (p_fund_id, role_labels[i], 'system', stakeholder_types[i], false)
    ON CONFLICT (fund_id, role_name) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create system roles for all existing funds
DO $$
DECLARE
  fund_record RECORD;
BEGIN
  FOR fund_record IN SELECT id FROM funds LOOP
    PERFORM create_system_roles_for_fund(fund_record.id);
  END LOOP;
END $$;

-- ============================================
-- 8. Migration: Convert old permissions to new format
-- ============================================

-- Map old boolean permissions to new path-based permissions
DO $$
DECLARE
  old_perm RECORD;
  new_role_id UUID;
BEGIN
  FOR old_perm IN 
    SELECT * FROM stakeholder_type_permissions
  LOOP
    -- Find or create the corresponding role
    SELECT id INTO new_role_id 
    FROM stakeholder_roles 
    WHERE fund_id = old_perm.fund_id 
      AND base_stakeholder_type = old_perm.stakeholder_type
    LIMIT 1;
    
    IF new_role_id IS NOT NULL THEN
      -- Migrate boolean permissions to path-based entries
      
      -- Dashboard (always on for existing permissions)
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'dashboard', 'view', true)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Deals base access
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'deals', 'view', true)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Detailed financials -> deals.financials and subcategories
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES 
        (new_role_id, 'deals.financials', 'view', old_perm.can_view_detailed_financials),
        (new_role_id, 'deals.financials.debt_service', 'view', old_perm.can_view_detailed_financials)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Outliers
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'deals.outliers', 'view', old_perm.can_view_outliers)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Other investors
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'investors', 'view', old_perm.can_view_other_investors)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Pipeline
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'pipeline', 'view', old_perm.can_view_pipeline)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Fund documents
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'documents.fund_documents', 'view', old_perm.can_view_fund_documents)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Deal documents
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'documents.deal_documents', 'view', old_perm.can_view_deal_documents)
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- Other investor docs
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'documents.investor_documents.view_all', 'view', COALESCE(old_perm.can_view_other_investor_docs, false))
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- All communications
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
      VALUES (new_role_id, 'communications.view_all', 'view', COALESCE(old_perm.can_view_all_communications, false))
      ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      
      -- KPI detail level mapping
      IF old_perm.kpi_detail_level = 'full' THEN
        INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
        VALUES 
          (new_role_id, 'deals.financials.rent_revenue', 'view', true),
          (new_role_id, 'deals.financials.occupancy', 'view', true),
          (new_role_id, 'deals.financials.performance', 'view', true),
          (new_role_id, 'reports', 'view', true)
        ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      ELSIF old_perm.kpi_detail_level = 'detailed' THEN
        INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
        VALUES 
          (new_role_id, 'deals.financials.rent_revenue', 'view', true),
          (new_role_id, 'deals.financials.occupancy', 'view', true),
          (new_role_id, 'deals.financials.performance', 'view', true),
          (new_role_id, 'reports', 'view', true)
        ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      ELSE
        -- Summary level - basic access only
        INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
        VALUES 
          (new_role_id, 'deals.overview', 'view', true),
          (new_role_id, 'reports.fund_overview', 'view', true)
        ON CONFLICT (role_id, permission_path, permission_type) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 9. Link existing users/investors to their roles
-- ============================================

-- Update users with stakeholder_type to reference new role
UPDATE users u
SET role_id = sr.id
FROM stakeholder_roles sr
WHERE u.fund_id = sr.fund_id
  AND u.stakeholder_type = sr.base_stakeholder_type
  AND u.stakeholder_type IS NOT NULL;

-- Update investors to reference new role based on investor_type
UPDATE investors i
SET role_id = sr.id
FROM stakeholder_roles sr
WHERE i.fund_id = sr.fund_id
  AND i.investor_type = sr.base_stakeholder_type;

-- ============================================
-- 10. Function to seed default permissions for system roles
-- ============================================

CREATE OR REPLACE FUNCTION seed_default_role_permissions(p_role_id UUID, p_stakeholder_type TEXT)
RETURNS VOID AS $$
BEGIN
  -- Clear existing permissions for this role
  DELETE FROM role_permissions WHERE role_id = p_role_id;
  
  CASE p_stakeholder_type
    -- Fund Manager / Team Member - Full access
    WHEN 'team_member' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.overview', 'view', true),
        (p_role_id, 'deals.financials', 'view', true),
        (p_role_id, 'deals.financials.rent_revenue', 'view', true),
        (p_role_id, 'deals.financials.occupancy', 'view', true),
        (p_role_id, 'deals.financials.debt_service', 'view', true),
        (p_role_id, 'deals.financials.performance', 'view', true),
        (p_role_id, 'deals.milestones', 'view', true),
        (p_role_id, 'deals.milestones', 'create', true),
        (p_role_id, 'deals.milestones', 'edit', true),
        (p_role_id, 'deals.milestones', 'delete', true),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'deals.documents', 'create', true),
        (p_role_id, 'deals.investors', 'view', true),
        (p_role_id, 'deals.outliers', 'view', true),
        (p_role_id, 'investors', 'view', true),
        (p_role_id, 'investors', 'create', true),
        (p_role_id, 'investors', 'edit', true),
        (p_role_id, 'pipeline', 'view', true),
        (p_role_id, 'pipeline', 'create', true),
        (p_role_id, 'pipeline', 'edit', true),
        (p_role_id, 'capital_calls', 'view', true),
        (p_role_id, 'capital_calls', 'create', true),
        (p_role_id, 'capital_calls', 'edit', true),
        (p_role_id, 'documents', 'view', true),
        (p_role_id, 'documents', 'create', true),
        (p_role_id, 'reports', 'view', true),
        (p_role_id, 'communications', 'view', true),
        (p_role_id, 'communications', 'create', true),
        (p_role_id, 'data', 'view', true),
        (p_role_id, 'data', 'create', true);

    -- General Partner - Detailed access, no pipeline/investor management
    WHEN 'general_partner' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.overview', 'view', true),
        (p_role_id, 'deals.financials', 'view', true),
        (p_role_id, 'deals.financials.rent_revenue', 'view', true),
        (p_role_id, 'deals.financials.occupancy', 'view', true),
        (p_role_id, 'deals.financials.debt_service', 'view', true),
        (p_role_id, 'deals.financials.performance', 'view', true),
        (p_role_id, 'deals.milestones', 'view', true),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'deals.investors', 'view', true),
        (p_role_id, 'deals.outliers', 'view', true),
        (p_role_id, 'capital_calls.view_own', 'view', true),
        (p_role_id, 'capital_calls.view_all', 'view', true),
        (p_role_id, 'documents', 'view', true),
        (p_role_id, 'reports', 'view', true);

    -- Limited Partner - Restricted view
    WHEN 'limited_partner' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'dashboard.fund_overview', 'view', true),
        (p_role_id, 'dashboard.portfolio_summary', 'view', true),
        (p_role_id, 'dashboard.quick_actions', 'view', false),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.overview', 'view', true),
        (p_role_id, 'deals.overview.internal_notes', 'view', false),
        (p_role_id, 'deals.financials', 'view', true),
        (p_role_id, 'deals.financials.rent_revenue', 'view', true),
        (p_role_id, 'deals.financials.occupancy', 'view', true),
        (p_role_id, 'deals.financials.debt_service', 'view', false),
        (p_role_id, 'deals.financials.performance', 'view', true),
        (p_role_id, 'deals.financials.performance.irr', 'view', false),
        (p_role_id, 'deals.milestones', 'view', true),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'deals.investors', 'view', false),
        (p_role_id, 'deals.outliers', 'view', false),
        (p_role_id, 'investors', 'view', false),
        (p_role_id, 'pipeline', 'view', false),
        (p_role_id, 'capital_calls.view_own', 'view', true),
        (p_role_id, 'capital_calls.view_all', 'view', false),
        (p_role_id, 'documents.view_own', 'view', true),
        (p_role_id, 'documents.fund_documents', 'view', true),
        (p_role_id, 'documents.investor_documents.view_all', 'view', false),
        (p_role_id, 'reports.fund_overview', 'view', true),
        (p_role_id, 'reports.deal_performance', 'view', true),
        (p_role_id, 'reports.financial_report', 'view', false),
        (p_role_id, 'communications', 'view', false),
        (p_role_id, 'settings', 'view', false),
        (p_role_id, 'data', 'view', false);

    -- Attorney - Documents only
    WHEN 'attorney' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', false),
        (p_role_id, 'deals', 'view', false),
        (p_role_id, 'investors', 'view', false),
        (p_role_id, 'pipeline', 'view', false),
        (p_role_id, 'capital_calls', 'view', false),
        (p_role_id, 'documents', 'view', true),
        (p_role_id, 'documents.fund_documents', 'view', true),
        (p_role_id, 'documents.deal_documents', 'view', true),
        (p_role_id, 'documents.investor_documents', 'view', true),
        (p_role_id, 'reports', 'view', true),
        (p_role_id, 'communications', 'view', false),
        (p_role_id, 'settings', 'view', false),
        (p_role_id, 'data', 'view', false);

    -- Accountant - Financials, documents, reports
    WHEN 'accountant' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.financials', 'view', true),
        (p_role_id, 'deals.financials.rent_revenue', 'view', true),
        (p_role_id, 'deals.financials.occupancy', 'view', true),
        (p_role_id, 'deals.financials.debt_service', 'view', true),
        (p_role_id, 'deals.financials.performance', 'view', true),
        (p_role_id, 'deals.milestones', 'view', false),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'deals.investors', 'view', false),
        (p_role_id, 'investors', 'view', false),
        (p_role_id, 'pipeline', 'view', false),
        (p_role_id, 'capital_calls', 'view', true),
        (p_role_id, 'documents', 'view', true),
        (p_role_id, 'reports', 'view', true),
        (p_role_id, 'communications', 'view', false),
        (p_role_id, 'settings', 'view', false),
        (p_role_id, 'data', 'view', false);

    -- Property Manager - Deals only (milestones, notes, documents)
    WHEN 'property_manager' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', false),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.overview', 'view', true),
        (p_role_id, 'deals.financials', 'view', false),
        (p_role_id, 'deals.milestones', 'view', true),
        (p_role_id, 'deals.milestones', 'create', true),
        (p_role_id, 'deals.milestones', 'edit', true),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'deals.documents', 'create', true),
        (p_role_id, 'deals.investors', 'view', false),
        (p_role_id, 'deals.outliers', 'view', false),
        (p_role_id, 'investors', 'view', false),
        (p_role_id, 'pipeline', 'view', false),
        (p_role_id, 'capital_calls', 'view', false),
        (p_role_id, 'documents.deal_documents', 'view', true),
        (p_role_id, 'documents.deal_documents', 'create', true),
        (p_role_id, 'documents.fund_documents', 'view', false),
        (p_role_id, 'documents.investor_documents', 'view', false),
        (p_role_id, 'reports', 'view', false),
        (p_role_id, 'communications', 'view', false),
        (p_role_id, 'settings', 'view', false),
        (p_role_id, 'data', 'view', false);

    -- Series investors and others - Similar to LP
    WHEN 'series_a', 'series_b', 'series_c', 'institutional', 'individual_accredited', 'family_office' THEN
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'deals', 'view', true),
        (p_role_id, 'deals.overview', 'view', true),
        (p_role_id, 'deals.financials', 'view', true),
        (p_role_id, 'deals.financials.rent_revenue', 'view', true),
        (p_role_id, 'deals.financials.occupancy', 'view', true),
        (p_role_id, 'deals.financials.debt_service', 'view', false),
        (p_role_id, 'deals.financials.performance', 'view', true),
        (p_role_id, 'deals.milestones', 'view', true),
        (p_role_id, 'deals.documents', 'view', true),
        (p_role_id, 'capital_calls.view_own', 'view', true),
        (p_role_id, 'documents.view_own', 'view', true),
        (p_role_id, 'documents.fund_documents', 'view', true),
        (p_role_id, 'reports.fund_overview', 'view', true),
        (p_role_id, 'reports.deal_performance', 'view', true);

    ELSE
      -- Default minimal permissions
      INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted) VALUES
        (p_role_id, 'dashboard', 'view', true),
        (p_role_id, 'documents.view_own', 'view', true);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Seed default permissions for all existing system roles
-- ============================================

DO $$
DECLARE
  role_record RECORD;
BEGIN
  FOR role_record IN 
    SELECT id, base_stakeholder_type 
    FROM stakeholder_roles 
    WHERE role_type = 'system' AND base_stakeholder_type IS NOT NULL
  LOOP
    PERFORM seed_default_role_permissions(role_record.id, role_record.base_stakeholder_type);
  END LOOP;
END $$;

-- ============================================
-- 12. Function to copy permissions between roles
-- ============================================

CREATE OR REPLACE FUNCTION copy_role_permissions(p_source_role_id UUID, p_target_role_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Clear existing permissions on target
  DELETE FROM role_permissions WHERE role_id = p_target_role_id;
  
  -- Copy all permissions from source to target
  INSERT INTO role_permissions (role_id, permission_path, permission_type, is_granted)
  SELECT p_target_role_id, permission_path, permission_type, is_granted
  FROM role_permissions
  WHERE role_id = p_source_role_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. Function to check permission with inheritance
-- ============================================

CREATE OR REPLACE FUNCTION check_role_permission(
  p_role_id UUID,
  p_permission_path TEXT,
  p_permission_type TEXT DEFAULT 'view',
  p_deal_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
  v_path_parts TEXT[];
  v_current_path TEXT;
  i INT;
BEGIN
  -- Check deal-specific override first
  IF p_deal_id IS NOT NULL THEN
    SELECT is_granted INTO v_result
    FROM deal_permission_overrides
    WHERE role_id = p_role_id 
      AND deal_id = p_deal_id
      AND permission_path = p_permission_path
      AND permission_type = p_permission_type;
    
    IF FOUND THEN
      RETURN v_result;
    END IF;
  END IF;
  
  -- Check exact permission match
  SELECT is_granted INTO v_result
  FROM role_permissions
  WHERE role_id = p_role_id 
    AND permission_path = p_permission_path
    AND permission_type = p_permission_type;
  
  IF FOUND THEN
    RETURN v_result;
  END IF;
  
  -- Walk up the path tree for inheritance
  v_path_parts := string_to_array(p_permission_path, '.');
  
  FOR i IN REVERSE (array_length(v_path_parts, 1) - 1)..1 LOOP
    v_current_path := array_to_string(v_path_parts[1:i], '.');
    
    SELECT is_granted INTO v_result
    FROM role_permissions
    WHERE role_id = p_role_id 
      AND permission_path = v_current_path
      AND permission_type = p_permission_type;
    
    IF FOUND THEN
      RETURN v_result;
    END IF;
  END LOOP;
  
  -- Default to false if no permission found
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 14. Cleanup: Drop old table (after migration verified)
-- ============================================

-- Note: Keeping old table for now as backup
-- Uncomment below to drop after verifying migration
-- DROP TABLE IF EXISTS stakeholder_type_permissions CASCADE;

-- Add comment to indicate migration status
COMMENT ON TABLE stakeholder_type_permissions IS 'DEPRECATED: Migrated to stakeholder_roles + role_permissions. Will be dropped in future migration.';

