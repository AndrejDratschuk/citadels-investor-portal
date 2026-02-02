-- Migration: 045_email_templates
-- Description: Store customizable email templates per fund

-- Create table for fund-specific email template customizations
CREATE TABLE IF NOT EXISTS fund_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,           -- e.g., 'kyc_invite', 'capital_call_request'
  subject TEXT NOT NULL,                -- Email subject line with {{variable}} placeholders
  body TEXT NOT NULL,                   -- HTML body with {{variable}} placeholders
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE(fund_id, template_key)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_fund_email_templates_fund_id ON fund_email_templates(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_email_templates_template_key ON fund_email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_fund_email_templates_fund_key ON fund_email_templates(fund_id, template_key);

-- Enable RLS
ALTER TABLE fund_email_templates ENABLE ROW LEVEL SECURITY;

-- Managers can view their fund's templates
CREATE POLICY "managers_view_email_templates"
  ON fund_email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_email_templates.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can insert templates for their fund
CREATE POLICY "managers_insert_email_templates"
  ON fund_email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_email_templates.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can update their fund's templates
CREATE POLICY "managers_update_email_templates"
  ON fund_email_templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_email_templates.fund_id
        AND u.role = 'manager'
    )
  );

-- Managers can delete their fund's templates (reset to default)
CREATE POLICY "managers_delete_email_templates"
  ON fund_email_templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.fund_id = fund_email_templates.fund_id
        AND u.role = 'manager'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_templates_updated_at ON fund_email_templates;
CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON fund_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Comments
COMMENT ON TABLE fund_email_templates IS 'Stores customized email templates per fund, overriding system defaults';
COMMENT ON COLUMN fund_email_templates.template_key IS 'Unique identifier for the template type (e.g., kyc_invite, capital_call_request)';
COMMENT ON COLUMN fund_email_templates.subject IS 'Email subject line, may contain {{variable}} placeholders';
COMMENT ON COLUMN fund_email_templates.body IS 'HTML email body, may contain {{variable}} placeholders';
COMMENT ON COLUMN fund_email_templates.is_active IS 'Whether this custom template is active (false reverts to default)';
