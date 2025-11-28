-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'manager', 'accountant', 'attorney')),
  fund_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Funds
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  ein_encrypted TEXT,
  address JSONB,
  bank_info_encrypted JSONB,
  wire_instructions TEXT,
  target_raise DECIMAL(15,2),
  total_committed DECIMAL(15,2) DEFAULT 0,
  branding JSONB,
  status TEXT DEFAULT 'raising' CHECK (status IN ('raising', 'closed', 'active', 'liquidating')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for users.fund_id
ALTER TABLE users ADD CONSTRAINT users_fund_id_fkey FOREIGN KEY (fund_id) REFERENCES funds(id) ON DELETE SET NULL;

-- Investors
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address JSONB,
  
  -- Sensitive (encrypted)
  ssn_encrypted TEXT,
  date_of_birth DATE,
  
  -- Entity info
  entity_type TEXT CHECK (entity_type IN ('individual', 'joint', 'trust', 'llc', 'corporation')),
  entity_name TEXT,
  tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein')),
  
  -- Accreditation
  accreditation_status TEXT DEFAULT 'pending' CHECK (accreditation_status IN ('pending', 'approved', 'rejected', 'expired')),
  accreditation_type TEXT,
  accreditation_date DATE,
  verification_request_id TEXT,
  
  -- Investment
  commitment_amount DECIMAL(15,2) DEFAULT 0,
  total_called DECIMAL(15,2) DEFAULT 0,
  total_invested DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  onboarding_step INT DEFAULT 1,
  onboarded_at TIMESTAMPTZ,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'onboarding', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'prospective' CHECK (status IN ('prospective', 'under_contract', 'acquired', 'renovating', 'stabilized', 'for_sale', 'sold')),
  
  -- Property details
  address JSONB,
  property_type TEXT CHECK (property_type IN ('multifamily', 'office', 'retail', 'industrial', 'other')),
  unit_count INT,
  square_footage INT,
  
  -- Financials
  acquisition_price DECIMAL(15,2),
  acquisition_date DATE,
  current_value DECIMAL(15,2),
  total_investment DECIMAL(15,2),
  
  -- KPIs (stored as JSONB for flexibility)
  kpis JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investor-Deal junction
CREATE TABLE investor_deals (
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  ownership_percentage DECIMAL(5,4),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (investor_id, deal_id)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL CHECK (type IN ('ppm', 'subscription', 'k1', 'report', 'capital_call', 'kyc', 'other')),
  name TEXT NOT NULL,
  file_path TEXT,
  
  -- Signing
  requires_signature BOOLEAN DEFAULT FALSE,
  docusign_envelope_id TEXT,
  signing_status TEXT CHECK (signing_status IN ('not_sent', 'sent', 'viewed', 'signed', 'declined')),
  signed_at TIMESTAMPTZ,
  
  -- Access control
  visible_to TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Capital Calls
CREATE TABLE capital_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  total_amount DECIMAL(15,2) NOT NULL,
  percentage_of_fund DECIMAL(5,4) NOT NULL,
  deadline DATE NOT NULL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'funded', 'closed')),
  
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capital Call Items (per-investor breakdown)
CREATE TABLE capital_call_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  capital_call_id UUID REFERENCES capital_calls(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE NOT NULL,
  
  amount_due DECIMAL(15,2) NOT NULL,
  amount_received DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete')),
  
  wire_received_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(capital_call_id, investor_id)
);

-- Email Logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  klaviyo_message_id TEXT,
  
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (for compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_fund_id ON users(fund_id);
CREATE INDEX idx_investors_user_id ON investors(user_id);
CREATE INDEX idx_investors_fund_id ON investors(fund_id);
CREATE INDEX idx_deals_fund_id ON deals(fund_id);
CREATE INDEX idx_documents_fund_id ON documents(fund_id);
CREATE INDEX idx_documents_investor_id ON documents(investor_id);
CREATE INDEX idx_capital_calls_fund_id ON capital_calls(fund_id);
CREATE INDEX idx_capital_call_items_capital_call_id ON capital_call_items(capital_call_id);
CREATE INDEX idx_capital_call_items_investor_id ON capital_call_items(investor_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

