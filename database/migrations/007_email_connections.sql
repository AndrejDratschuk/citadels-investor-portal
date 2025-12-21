-- Email Connections table for OAuth email integration
-- Stores Gmail/Outlook OAuth tokens for fund managers

CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  
  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email TEXT NOT NULL,
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One active connection per user per provider
  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id ON email_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_fund_id ON email_connections(fund_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_provider ON email_connections(provider);















