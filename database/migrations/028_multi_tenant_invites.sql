-- Migration: Multi-Tenant Fund Creation & Team Invites
-- Description: Extends funds table for self-service creation, adds team_invites table,
--              and extends users table with name fields and onboarding status.

-- ============================================================================
-- 1. Extend funds table for multi-tenant support
-- ============================================================================

-- Add slug for URL-friendly fund identification (used in invite links)
ALTER TABLE funds ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Add fund type classification
ALTER TABLE funds ADD COLUMN IF NOT EXISTS fund_type VARCHAR(50) 
  CHECK (fund_type IN ('vc', 'pe', 'real_estate', 'hedge_fund', 'family_office', 'search_fund', 'other'));

-- Add country of registration
ALTER TABLE funds ADD COLUMN IF NOT EXISTS country VARCHAR(100);

-- Track who created the fund
ALTER TABLE funds ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_funds_slug ON funds(slug);

-- ============================================================================
-- 2. Extend users table for enhanced signup and onboarding
-- ============================================================================

-- Add name fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Add onboarding completion flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for onboarding status queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);

-- ============================================================================
-- 3. Create team_invites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'accountant', 'attorney', 'investor')),
  token VARCHAR(64) UNIQUE NOT NULL,
  invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for team_invites
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_fund_id ON team_invites(fund_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- Trigger for updated_at on team_invites
CREATE TRIGGER update_team_invites_updated_at 
  BEFORE UPDATE ON team_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. RLS Policies for team_invites
-- ============================================================================

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Fund managers can manage invites for their fund
CREATE POLICY managers_manage_team_invites ON team_invites
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- NOTE: Token verification is done via SECURITY DEFINER function below
-- instead of an open RLS policy to prevent information disclosure

-- ============================================================================
-- 4b. Secure token verification function (SECURITY DEFINER)
-- ============================================================================

-- This function safely exposes only necessary data for invite verification
-- without allowing public access to all team_invites rows
CREATE OR REPLACE FUNCTION public.verify_team_invite_token(p_token TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  invite_data JSON,
  error_message TEXT,
  is_existing_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  fund_name TEXT;
  inviter_name TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Find invite by token
  SELECT * INTO invite_record 
  FROM team_invites 
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::JSON, 'Invalid invite token'::TEXT, false;
    RETURN;
  END IF;
  
  -- Check if already used
  IF invite_record.status != 'pending' THEN
    RETURN QUERY SELECT false, NULL::JSON, ('Invite has already been ' || invite_record.status)::TEXT, false;
    RETURN;
  END IF;

  -- Check expiration
  IF invite_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::JSON, 'Invite has expired'::TEXT, false;
    RETURN;
  END IF;

  -- Get fund name
  SELECT name INTO fund_name FROM funds WHERE id = invite_record.fund_id;
  
  -- Get inviter name
  SELECT 
    COALESCE(first_name || ' ' || last_name, email) INTO inviter_name 
  FROM users 
  WHERE id = invite_record.invited_by_user_id;

  -- Check if user already exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = invite_record.email
  ) INTO user_exists;

  -- Return safe subset of data
  RETURN QUERY SELECT
    true AS is_valid,
    json_build_object(
      'id', invite_record.id,
      'email', invite_record.email,
      'fundId', invite_record.fund_id,
      'fundName', COALESCE(fund_name, 'Unknown Fund'),
      'role', invite_record.role,
      'invitedByName', COALESCE(inviter_name, 'A team member'),
      'expiresAt', invite_record.expires_at
    ) AS invite_data,
    NULL::TEXT AS error_message,
    user_exists AS is_existing_user;
END;
$$;

-- ============================================================================
-- 5. One-Time Data Migration (CODE_GUIDELINES.md Guideline 7)
-- ============================================================================
-- Migrate existing data - no runtime compatibility layers

-- Set onboarding_completed = true for users who already have a fund
UPDATE users SET onboarding_completed = true WHERE fund_id IS NOT NULL;

-- Generate slugs for existing funds from their names
UPDATE funds 
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL;

-- Handle duplicate slugs by appending a random suffix
DO $$
DECLARE
  dup_slug VARCHAR;
  fund_rec RECORD;
BEGIN
  FOR dup_slug IN
    SELECT slug FROM funds GROUP BY slug HAVING COUNT(*) > 1
  LOOP
    FOR fund_rec IN
      SELECT id, slug FROM funds WHERE slug = dup_slug OFFSET 1
    LOOP
      UPDATE funds 
      SET slug = fund_rec.slug || '-' || substring(gen_random_uuid()::text, 1, 8)
      WHERE id = fund_rec.id;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 6. Helper function to check if user is a team member of a fund
-- ============================================================================

CREATE OR REPLACE FUNCTION is_fund_team_member(p_user_id UUID, p_fund_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_user_id 
    AND fund_id = p_fund_id 
    AND role IN ('manager', 'accountant', 'attorney')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Function to clean up expired invites (run periodically)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_team_invites()
RETURNS void AS $$
BEGIN
  UPDATE team_invites
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

