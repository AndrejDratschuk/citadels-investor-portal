-- Migration: 021_docusign_credentials
-- Description: Store DocuSign API credentials per fund (user-provided, not env vars)

-- Create table to store DocuSign credentials per fund
CREATE TABLE IF NOT EXISTS fund_docusign_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  integration_key TEXT NOT NULL,
  account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rsa_private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fund_id)
);

-- Create index for fund lookup
CREATE INDEX IF NOT EXISTS idx_fund_docusign_credentials_fund_id ON fund_docusign_credentials(fund_id);

-- RLS policies
ALTER TABLE fund_docusign_credentials ENABLE ROW LEVEL SECURITY;

-- Managers can view their fund's credentials
CREATE POLICY "managers_view_docusign_credentials"
  ON fund_docusign_credentials
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_docusign_credentials.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can insert credentials for their fund
CREATE POLICY "managers_insert_docusign_credentials"
  ON fund_docusign_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_docusign_credentials.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can update their fund's credentials
CREATE POLICY "managers_update_docusign_credentials"
  ON fund_docusign_credentials
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_docusign_credentials.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can delete their fund's credentials
CREATE POLICY "managers_delete_docusign_credentials"
  ON fund_docusign_credentials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_docusign_credentials.fund_id
        AND u.role = 'manager'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_docusign_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_docusign_credentials_updated_at ON fund_docusign_credentials;
CREATE TRIGGER trigger_update_docusign_credentials_updated_at
  BEFORE UPDATE ON fund_docusign_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_docusign_credentials_updated_at();

