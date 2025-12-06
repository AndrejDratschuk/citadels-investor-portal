-- Add SMTP support to email_connections table
-- This allows users to connect any email provider via SMTP

-- Update provider check constraint to include 'smtp'
ALTER TABLE email_connections 
DROP CONSTRAINT IF EXISTS email_connections_provider_check;

ALTER TABLE email_connections 
ADD CONSTRAINT email_connections_provider_check 
CHECK (provider IN ('gmail', 'outlook', 'smtp'));

-- Add SMTP-specific columns
ALTER TABLE email_connections
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS smtp_username TEXT;

-- Note: The password will be stored in the existing access_token column (encrypted)
-- refresh_token and token_expires_at are not used for SMTP but we keep them nullable

COMMENT ON COLUMN email_connections.smtp_host IS 'SMTP server hostname (e.g., smtp.zoho.com)';
COMMENT ON COLUMN email_connections.smtp_port IS 'SMTP server port (typically 465 for SSL or 587 for TLS)';
COMMENT ON COLUMN email_connections.smtp_secure IS 'Whether to use TLS/SSL (true for port 465, usually true for 587)';
COMMENT ON COLUMN email_connections.smtp_username IS 'SMTP username (often same as email address)';

