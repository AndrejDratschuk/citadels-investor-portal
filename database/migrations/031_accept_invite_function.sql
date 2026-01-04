-- Migration: Accept Team Invite Function
-- Description: Creates a SECURITY DEFINER function to reliably update invite status
--              This bypasses any RLS/client issues that may prevent normal UPDATE

-- Function to mark an invite as accepted (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION accept_team_invite(p_invite_id UUID, p_accepted_at TIMESTAMPTZ)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE team_invites
  SET status = 'accepted', accepted_at = p_accepted_at
  WHERE id = p_invite_id AND status = 'pending';
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- Grant execute permission to authenticated users (the service role will call this)
GRANT EXECUTE ON FUNCTION accept_team_invite(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_team_invite(UUID, TIMESTAMPTZ) TO service_role;

