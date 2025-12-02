-- Fix infinite recursion in RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Managers can view fund users" ON users;
DROP POLICY IF EXISTS "Managers can view fund investors" ON investors;
DROP POLICY IF EXISTS "Accountants can view fund investors" ON investors;
DROP POLICY IF EXISTS "Managers can manage fund investors" ON investors;

-- Create a secure function to get user details without triggering RLS
-- This function runs with the privileges of the creator (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_claim(claim text) 
RETURNS jsonb 
LANGUAGE sql STABLE SECURITY DEFINER 
AS $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' ->> claim, null)
$$;

-- Ideally we would store role in app_metadata, but since we store it in the users table,
-- we need a function to look it up safely.

CREATE OR REPLACE FUNCTION is_manager(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION get_user_fund_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fund_id FROM users WHERE id = user_id;
$$;

-- Re-create Users policies safely
CREATE POLICY "Managers can view fund users" ON users
  FOR SELECT USING (
    fund_id = get_user_fund_id(auth.uid())
    AND is_manager(auth.uid())
  );

-- Re-create Investors policies safely
CREATE POLICY "Managers can view fund investors" ON investors
  FOR SELECT USING (
    fund_id = get_user_fund_id(auth.uid())
    AND is_manager(auth.uid())
  );

CREATE POLICY "Accountants can view fund investors" ON investors
  FOR SELECT USING (
    fund_id = get_user_fund_id(auth.uid())
    AND (
        SELECT role FROM users WHERE id = auth.uid()
    ) = 'accountant'
  );

CREATE POLICY "Managers can manage fund investors" ON investors
  FOR ALL USING (
    fund_id = get_user_fund_id(auth.uid())
    AND is_manager(auth.uid())
  );


