-- Migration: 044_docusign_oauth
-- Description: Add OAuth support to DocuSign credentials table
-- Supports both JWT Grant (existing) and OAuth Authorization Code (new) flows

-- Add new columns for OAuth support
ALTER TABLE fund_docusign_credentials
  ADD COLUMN IF NOT EXISTS auth_type TEXT NOT NULL DEFAULT 'jwt' CHECK (auth_type IN ('jwt', 'oauth')),
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS docusign_user_email TEXT,
  ADD COLUMN IF NOT EXISTS base_url TEXT DEFAULT 'https://demo.docusign.net';

-- Make JWT-specific columns nullable for OAuth flow
-- Note: rsa_private_key is required for JWT but not for OAuth
ALTER TABLE fund_docusign_credentials
  ALTER COLUMN rsa_private_key DROP NOT NULL;

-- Add constraint to ensure proper fields are present based on auth_type
-- For JWT: integration_key, account_id, user_id, rsa_private_key are required
-- For OAuth: access_token, refresh_token, token_expires_at, account_id are required
CREATE OR REPLACE FUNCTION check_docusign_auth_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auth_type = 'jwt' THEN
    IF NEW.rsa_private_key IS NULL OR NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'JWT auth requires rsa_private_key and user_id';
    END IF;
  ELSIF NEW.auth_type = 'oauth' THEN
    IF NEW.access_token IS NULL OR NEW.refresh_token IS NULL THEN
      RAISE EXCEPTION 'OAuth auth requires access_token and refresh_token';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_docusign_auth_type ON fund_docusign_credentials;
CREATE TRIGGER trigger_check_docusign_auth_type
  BEFORE INSERT OR UPDATE ON fund_docusign_credentials
  FOR EACH ROW
  EXECUTE FUNCTION check_docusign_auth_type();

-- Add index for quick lookup by auth type
CREATE INDEX IF NOT EXISTS idx_fund_docusign_credentials_auth_type 
  ON fund_docusign_credentials(auth_type);

COMMENT ON COLUMN fund_docusign_credentials.auth_type IS 'Authentication method: jwt (server-to-server) or oauth (user-delegated)';
COMMENT ON COLUMN fund_docusign_credentials.access_token IS 'OAuth access token (for oauth auth_type)';
COMMENT ON COLUMN fund_docusign_credentials.refresh_token IS 'OAuth refresh token (for oauth auth_type)';
COMMENT ON COLUMN fund_docusign_credentials.token_expires_at IS 'When the access token expires (for oauth auth_type)';
COMMENT ON COLUMN fund_docusign_credentials.docusign_user_email IS 'Email of the DocuSign user who authorized the connection';
COMMENT ON COLUMN fund_docusign_credentials.base_url IS 'DocuSign API base URL (demo or production)';
