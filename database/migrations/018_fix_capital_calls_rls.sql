-- Fix infinite recursion in capital_calls RLS policies
-- Drop existing policies and recreate without recursion

-- First, drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Managers can view their fund's capital calls" ON capital_calls;
DROP POLICY IF EXISTS "Managers can create capital calls for their fund" ON capital_calls;
DROP POLICY IF EXISTS "Investors can view their capital calls" ON capital_calls;
DROP POLICY IF EXISTS "capital_calls_select_policy" ON capital_calls;
DROP POLICY IF EXISTS "capital_calls_insert_policy" ON capital_calls;

-- Enable RLS
ALTER TABLE capital_calls ENABLE ROW LEVEL SECURITY;

-- Simple policy: managers can do everything on their fund's capital calls
CREATE POLICY "managers_full_access"
  ON capital_calls
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Investors can view capital calls for their fund
CREATE POLICY "investors_view_own_fund"
  ON capital_calls
  FOR SELECT
  USING (
    fund_id IN (
      SELECT fund_id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Service role bypass (for backend API)
CREATE POLICY "service_role_bypass"
  ON capital_calls
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE capital_calls IS 'Capital calls with fixed RLS policies - no recursion';

