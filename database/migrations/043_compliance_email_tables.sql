-- Migration: Stage 05 - Compliance & Re-Verification Email Support
-- Description: Adds tables and fields for compliance email workflows including
--              re-KYC, accreditation reverification, banking updates, PPM amendments, and material events.

-- ============================================================================
-- 1. Fund Amendments Table
-- ============================================================================
-- Tracks PPM/OA amendments for compliance notifications
CREATE TABLE IF NOT EXISTS fund_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  amendment_summary TEXT,
  effective_date DATE NOT NULL,
  acknowledgment_required BOOLEAN DEFAULT false,
  acknowledgment_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_amendments_fund_id ON fund_amendments(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_amendments_effective_date ON fund_amendments(effective_date);

COMMENT ON TABLE fund_amendments IS 'Tracks PPM/Operating Agreement amendments for investor notifications';
COMMENT ON COLUMN fund_amendments.document_name IS 'Name of the amended document (e.g., PPM, Operating Agreement)';
COMMENT ON COLUMN fund_amendments.amendment_summary IS 'Summary of changes - may contain HTML';
COMMENT ON COLUMN fund_amendments.acknowledgment_required IS 'Whether investors must acknowledge the amendment';
COMMENT ON COLUMN fund_amendments.acknowledgment_note IS 'Custom note about acknowledgment requirements - may contain HTML';

-- ============================================================================
-- 2. Material Events Table
-- ============================================================================
-- Tracks material events for fund communications
CREATE TABLE IF NOT EXISTS material_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  details_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_events_fund_id ON material_events(fund_id);
CREATE INDEX IF NOT EXISTS idx_material_events_published_at ON material_events(published_at);

COMMENT ON TABLE material_events IS 'Tracks material events requiring investor notification';
COMMENT ON COLUMN material_events.content IS 'Event content - may contain HTML';
COMMENT ON COLUMN material_events.details_url IS 'URL for additional event details';
COMMENT ON COLUMN material_events.published_at IS 'When the event was published to investors';

-- ============================================================================
-- 3. Investor Amendment Acknowledgments Table
-- ============================================================================
-- Tracks which investors have acknowledged fund amendments
CREATE TABLE IF NOT EXISTS investor_amendment_acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amendment_id UUID REFERENCES fund_amendments(id) ON DELETE CASCADE NOT NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  UNIQUE(amendment_id, investor_id)
);

CREATE INDEX IF NOT EXISTS idx_amendment_acks_amendment_id ON investor_amendment_acknowledgments(amendment_id);
CREATE INDEX IF NOT EXISTS idx_amendment_acks_investor_id ON investor_amendment_acknowledgments(investor_id);

COMMENT ON TABLE investor_amendment_acknowledgments IS 'Tracks investor acknowledgments of fund amendments';

-- ============================================================================
-- 4. Extend Investors Table for Compliance Tracking
-- ============================================================================

-- Re-KYC tracking
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS rekyc_required_at TIMESTAMPTZ;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS rekyc_completed_at TIMESTAMPTZ;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS rekyc_reason TEXT;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS rekyc_deadline DATE;

-- Accreditation expiry tracking
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS accreditation_expires_at DATE;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS accreditation_reverification_sent_at TIMESTAMPTZ;

-- Banking failure tracking
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS banking_update_required BOOLEAN DEFAULT false;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS banking_failure_reason TEXT;

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS banking_failure_at TIMESTAMPTZ;

-- Create indexes for compliance queries
CREATE INDEX IF NOT EXISTS idx_investors_rekyc_required ON investors(rekyc_required_at) WHERE rekyc_required_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investors_accreditation_expires ON investors(accreditation_expires_at) WHERE accreditation_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investors_banking_update ON investors(banking_update_required) WHERE banking_update_required = true;

COMMENT ON COLUMN investors.rekyc_required_at IS 'When re-KYC was required for this investor';
COMMENT ON COLUMN investors.rekyc_completed_at IS 'When re-KYC was completed';
COMMENT ON COLUMN investors.rekyc_reason IS 'Reason for re-KYC requirement';
COMMENT ON COLUMN investors.rekyc_deadline IS 'Deadline for completing re-KYC';
COMMENT ON COLUMN investors.accreditation_expires_at IS 'When accreditation status expires (506c compliance)';
COMMENT ON COLUMN investors.accreditation_reverification_sent_at IS 'When accreditation reverification email was sent';
COMMENT ON COLUMN investors.banking_update_required IS 'Whether investor needs to update banking info';
COMMENT ON COLUMN investors.banking_failure_reason IS 'Reason for banking/payment failure';
COMMENT ON COLUMN investors.banking_failure_at IS 'When the banking failure occurred';

-- ============================================================================
-- 5. Compliance Email Tracking
-- ============================================================================
-- Track when compliance emails are sent to avoid duplicates
CREATE TABLE IF NOT EXISTS compliance_email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'rekyc_required',
    'accreditation_reverification', 
    'banking_update_request',
    'ppm_amendment',
    'material_event'
  )),
  reference_id UUID, -- References amendment_id or material_event_id when applicable
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_compliance_email_log_investor ON compliance_email_log(investor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_email_log_fund ON compliance_email_log(fund_id);
CREATE INDEX IF NOT EXISTS idx_compliance_email_log_type ON compliance_email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_compliance_email_log_reference ON compliance_email_log(reference_id) WHERE reference_id IS NOT NULL;

COMMENT ON TABLE compliance_email_log IS 'Tracks compliance emails sent to investors for audit and suppression';
COMMENT ON COLUMN compliance_email_log.email_type IS 'Type of compliance email sent';
COMMENT ON COLUMN compliance_email_log.reference_id IS 'Reference to related record (amendment_id, material_event_id)';

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE fund_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_amendment_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_email_log ENABLE ROW LEVEL SECURITY;

-- Fund amendments: managers can manage, investors can view their fund's amendments
CREATE POLICY managers_manage_fund_amendments ON fund_amendments
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );

CREATE POLICY investors_view_fund_amendments ON fund_amendments
  FOR SELECT
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Material events: managers can manage, investors can view published events
CREATE POLICY managers_manage_material_events ON material_events
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );

CREATE POLICY investors_view_published_material_events ON material_events
  FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND fund_id IN (
      SELECT fund_id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Amendment acknowledgments: investors can acknowledge their own
CREATE POLICY investors_manage_own_acknowledgments ON investor_amendment_acknowledgments
  FOR ALL
  TO authenticated
  USING (
    investor_id IN (
      SELECT id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Compliance email log: managers can view
CREATE POLICY managers_view_compliance_email_log ON compliance_email_log
  FOR SELECT
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'manager'
    )
  );
