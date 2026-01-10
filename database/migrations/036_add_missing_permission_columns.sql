-- Add missing columns to stakeholder_type_permissions table
-- These columns were expected by the code but not added in the initial migration

-- ============================================
-- 1. Add missing boolean columns
-- ============================================

ALTER TABLE stakeholder_type_permissions 
  ADD COLUMN IF NOT EXISTS can_view_other_investor_docs BOOLEAN DEFAULT false;

ALTER TABLE stakeholder_type_permissions 
  ADD COLUMN IF NOT EXISTS can_view_all_communications BOOLEAN DEFAULT false;

-- ============================================
-- 2. Update existing rows with sensible defaults
-- ============================================

-- Team members get full access to these new permissions
UPDATE stakeholder_type_permissions 
SET 
  can_view_other_investor_docs = true,
  can_view_all_communications = true
WHERE stakeholder_type = 'team_member';

-- Attorneys can view other investor docs for due diligence
UPDATE stakeholder_type_permissions 
SET can_view_other_investor_docs = true
WHERE stakeholder_type = 'attorney';

