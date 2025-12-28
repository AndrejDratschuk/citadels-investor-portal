-- Add automation tracking columns to email_logs table
-- These columns enable tracking of automated email executions

-- Add automation-specific columns
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS automation_type TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS trigger_event TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS related_entity_type TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Rename klaviyo_message_id to message_id (more generic)
ALTER TABLE email_logs RENAME COLUMN klaviyo_message_id TO message_id;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_fund_id ON email_logs(fund_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_automation_type ON email_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Comment on columns for documentation
COMMENT ON COLUMN email_logs.automation_type IS 'Type of automation that triggered this email (e.g., document_approval, capital_call_request)';
COMMENT ON COLUMN email_logs.trigger_event IS 'The specific event that triggered this email (e.g., manager_approved_document)';
COMMENT ON COLUMN email_logs.related_entity_type IS 'Type of related entity (e.g., document, capital_call, investor)';
COMMENT ON COLUMN email_logs.related_entity_id IS 'ID of the related entity';
COMMENT ON COLUMN email_logs.metadata IS 'Additional context about the email send (JSON)';

