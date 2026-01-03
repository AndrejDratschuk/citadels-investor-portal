-- Migration: Fix Fund Creation RLS Policy
-- Description: Allow managers without a fund to create their first fund during onboarding
-- 
-- Problem: The existing "Managers can manage their fund" policy (FOR ALL) blocks
-- INSERT because it checks if the new fund's ID is in the user's fund_id (which
-- is impossible for a new fund).

-- ============================================================================
-- Step 1: Drop the conflicting FOR ALL policy
-- ============================================================================

DROP POLICY IF EXISTS "Managers can manage their fund" ON funds;

-- ============================================================================
-- Step 2: Create separate policies for different operations
-- ============================================================================

-- Allow managers to SELECT, UPDATE, DELETE funds they're associated with
CREATE POLICY "Managers can manage their fund" ON funds
  FOR ALL
  USING (
    id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Allow managers WITHOUT a fund to INSERT a new fund
CREATE POLICY "Managers can create first fund" ON funds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'manager' 
      AND fund_id IS NULL
    )
  );

-- ============================================================================
-- Notes:
-- - The "Managers can manage their fund" policy handles existing fund operations
-- - The "Managers can create first fund" policy allows onboarding fund creation
-- - Once the user creates a fund, their fund_id is set and the first policy applies
-- ============================================================================

