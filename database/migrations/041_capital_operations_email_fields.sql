-- Migration: 041_capital_operations_email_fields
-- Description: Add tables and fields for Stage 03 Capital Operations email flows
-- Date: 2026-01-18

-- ============================================================
-- DISTRIBUTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  
  -- Distribution details
  amount DECIMAL(15,2) NOT NULL,
  distribution_type TEXT NOT NULL CHECK (distribution_type IN ('return_of_capital', 'profit', 'dividend', 'interest', 'sale_proceeds', 'refinance_proceeds', 'other')),
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wire', 'ach', 'check')),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'completed', 'failed', 'cancelled')),
  
  -- Confirmation details
  confirmation_number TEXT,
  date_sent TIMESTAMPTZ,
  arrival_timeframe TEXT DEFAULT '1-3 business days',
  
  -- Source reference (for refinance/sale proceeds)
  source_type TEXT CHECK (source_type IN ('property_sale', 'refinance', 'operating_income', 'other')),
  source_reference TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for distributions
CREATE INDEX IF NOT EXISTS idx_distributions_fund_id ON distributions(fund_id);
CREATE INDEX IF NOT EXISTS idx_distributions_investor_id ON distributions(investor_id);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON distributions(status);
CREATE INDEX IF NOT EXISTS idx_distributions_payment_date ON distributions(payment_date);

-- Comments for distributions
COMMENT ON TABLE distributions IS 'Tracks fund distributions to investors';
COMMENT ON COLUMN distributions.distribution_type IS 'Type of distribution: return_of_capital, profit, dividend, interest, sale_proceeds, refinance_proceeds, other';
COMMENT ON COLUMN distributions.payment_method IS 'Method of payment: wire, ach, check';
COMMENT ON COLUMN distributions.source_type IS 'Source of distribution proceeds for elections';

-- ============================================================
-- DISTRIBUTION ELECTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS distribution_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  
  -- Election details
  eligible_amount DECIMAL(15,2) NOT NULL,
  source TEXT NOT NULL,
  election_deadline TIMESTAMPTZ NOT NULL,
  
  -- Investor choice
  election_type TEXT CHECK (election_type IN ('distribute', 'reinvest')),
  elected_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'elected', 'defaulted', 'processed')),
  default_election TEXT DEFAULT 'distribute' CHECK (default_election IN ('distribute', 'reinvest')),
  
  -- Related distribution (created after election)
  distribution_id UUID REFERENCES distributions(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for distribution_elections
CREATE INDEX IF NOT EXISTS idx_distribution_elections_fund_id ON distribution_elections(fund_id);
CREATE INDEX IF NOT EXISTS idx_distribution_elections_investor_id ON distribution_elections(investor_id);
CREATE INDEX IF NOT EXISTS idx_distribution_elections_status ON distribution_elections(status);
CREATE INDEX IF NOT EXISTS idx_distribution_elections_deadline ON distribution_elections(election_deadline);

-- Comments for distribution_elections
COMMENT ON TABLE distribution_elections IS 'Tracks investor elections for distribution proceeds (distribute vs reinvest)';
COMMENT ON COLUMN distribution_elections.default_election IS 'Default election per subscription agreement if investor does not respond';

-- ============================================================
-- REFINANCE NOTICES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS refinance_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  property_name TEXT NOT NULL,
  
  -- Refinance summary (markdown/html content)
  refinance_summary TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for refinance_notices
CREATE INDEX IF NOT EXISTS idx_refinance_notices_fund_id ON refinance_notices(fund_id);
CREATE INDEX IF NOT EXISTS idx_refinance_notices_deal_id ON refinance_notices(deal_id);

-- Comments for refinance_notices
COMMENT ON TABLE refinance_notices IS 'Tracks refinance completion notices sent to investors';

-- ============================================================
-- EXTEND FUNDS TABLE FOR DEFAULT NOTICE CONTENT
-- ============================================================

ALTER TABLE funds
ADD COLUMN IF NOT EXISTS legal_default_notice_content TEXT,
ADD COLUMN IF NOT EXISTS default_section TEXT DEFAULT 'Section 4.2';

-- Comments for new fund columns
COMMENT ON COLUMN funds.legal_default_notice_content IS 'Legal content for capital call default notices (from Operating Agreement)';
COMMENT ON COLUMN funds.default_section IS 'Operating Agreement section reference for default procedures';

-- ============================================================
-- EXTEND CAPITAL_CALL_ITEMS FOR EMAIL TRACKING
-- ============================================================

ALTER TABLE capital_call_items
ADD COLUMN IF NOT EXISTS past_due_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS past_due_7_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS default_initiated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS default_notice_sent_at TIMESTAMPTZ;

-- Comments for new capital_call_items columns
COMMENT ON COLUMN capital_call_items.past_due_email_sent_at IS 'Timestamp when past due email was sent';
COMMENT ON COLUMN capital_call_items.past_due_7_email_sent_at IS 'Timestamp when +7 days past due email was sent';
COMMENT ON COLUMN capital_call_items.default_initiated_at IS 'Timestamp when default proceedings were initiated';
COMMENT ON COLUMN capital_call_items.default_notice_sent_at IS 'Timestamp when formal default notice was sent';

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE refinance_notices ENABLE ROW LEVEL SECURITY;

-- Distributions: Fund managers can manage, investors can view their own
CREATE POLICY distributions_fund_manager_all ON distributions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fund_stakeholders fs
      WHERE fs.fund_id = distributions.fund_id
      AND fs.user_id = auth.uid()
      AND fs.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY distributions_investor_select ON distributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = distributions.investor_id
      AND i.user_id = auth.uid()
    )
  );

-- Distribution Elections: Fund managers can manage, investors can view/update their own
CREATE POLICY distribution_elections_fund_manager_all ON distribution_elections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fund_stakeholders fs
      WHERE fs.fund_id = distribution_elections.fund_id
      AND fs.user_id = auth.uid()
      AND fs.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY distribution_elections_investor_select ON distribution_elections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = distribution_elections.investor_id
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY distribution_elections_investor_update ON distribution_elections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = distribution_elections.investor_id
      AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = distribution_elections.investor_id
      AND i.user_id = auth.uid()
    )
  );

-- Refinance Notices: Fund managers can manage, investors can view via fund membership
CREATE POLICY refinance_notices_fund_manager_all ON refinance_notices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fund_stakeholders fs
      WHERE fs.fund_id = refinance_notices.fund_id
      AND fs.user_id = auth.uid()
      AND fs.role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY refinance_notices_investor_select ON refinance_notices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.fund_id = refinance_notices.fund_id
      AND i.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_distributions_updated_at
  BEFORE UPDATE ON distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_elections_updated_at
  BEFORE UPDATE ON distribution_elections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
