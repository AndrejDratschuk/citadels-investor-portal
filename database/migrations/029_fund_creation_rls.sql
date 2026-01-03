-- Migration: Fix Fund Creation RLS Policy
-- Description: Allow managers without a fund to create their first fund during onboarding
-- 
-- Problem: The existing "Managers can manage their fund" policy only allows
-- managers to manage funds they're already associated with. During onboarding,
-- users have fund_id = NULL, so they can't INSERT a new fund.

-- ============================================================================
-- Add INSERT policy for fund creation during onboarding
-- ============================================================================

-- Allow managers without a fund to create their first fund
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

-- Note: Once the user creates a fund and gets assigned to it (fund_id is set),
-- the existing "Managers can manage their fund" policy takes over for all
-- subsequent operations (SELECT, UPDATE, DELETE).

