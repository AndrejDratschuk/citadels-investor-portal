-- Migration: 042_exit_transfer_email_fields
-- Description: Add tables and fields for Stage 06 Exit & Transfer email flows
-- Date: 2026-01-18

-- ============================================================
-- TRANSFER REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  
  -- Transfer details
  transfer_type TEXT NOT NULL CHECK (transfer_type IN ('full', 'partial')),
  amount DECIMAL(15,2), -- For partial transfers
  reason TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  denial_reason TEXT,
  effective_date DATE,
  
  -- Email tracking
  request_received_email_sent_at TIMESTAMPTZ,
  approval_email_sent_at TIMESTAMPTZ,
  denial_email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  denied_at TIMESTAMPTZ
);

-- Indexes for transfer_requests
CREATE INDEX IF NOT EXISTS idx_transfer_requests_fund_id ON transfer_requests(fund_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_investor_id ON transfer_requests(investor_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status);

-- Comments for transfer_requests
COMMENT ON TABLE transfer_requests IS 'Tracks investor transfer/exit requests';
COMMENT ON COLUMN transfer_requests.transfer_type IS 'Type of transfer: full (complete exit) or partial';
COMMENT ON COLUMN transfer_requests.amount IS 'Amount for partial transfers, NULL for full transfers';
COMMENT ON COLUMN transfer_requests.effective_date IS 'Date when the transfer takes effect (set on approval)';

-- ============================================================
-- EXTEND INVESTORS TABLE FOR EXIT TRACKING
-- ============================================================

ALTER TABLE investors
ADD COLUMN IF NOT EXISTS exit_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS exit_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS exit_reason TEXT;

-- Update the status constraint to include 'exited' if not already present
-- First check if constraint exists and drop it
ALTER TABLE investors DROP CONSTRAINT IF EXISTS investors_status_check;

-- Add updated constraint with 'exited' status
ALTER TABLE investors 
ADD CONSTRAINT investors_status_check 
CHECK (status IN ('active', 'inactive', 'exited', 'prospect', 'onboarding'));

-- Comments for new investor columns
COMMENT ON COLUMN investors.exit_requested_at IS 'Timestamp when investor requested to exit';
COMMENT ON COLUMN investors.exit_completed_at IS 'Timestamp when investor exit was finalized';
COMMENT ON COLUMN investors.exit_reason IS 'Reason provided for exit request';

-- ============================================================
-- EXTEND FUNDS TABLE FOR CONFIGURABLE EMAIL CONTENT
-- ============================================================

ALTER TABLE funds
ADD COLUMN IF NOT EXISTS transfer_process_note TEXT,
ADD COLUMN IF NOT EXISTS transfer_next_steps TEXT,
ADD COLUMN IF NOT EXISTS transfer_denial_options TEXT,
ADD COLUMN IF NOT EXISTS exit_closing_message TEXT;

-- Comments for new fund columns
COMMENT ON COLUMN funds.transfer_process_note IS 'Configurable content for transfer request received email [[TRANSFER_PROCESS_NOTE]]';
COMMENT ON COLUMN funds.transfer_next_steps IS 'Configurable content for transfer approved email [[TRANSFER_NEXT_STEPS]]';
COMMENT ON COLUMN funds.transfer_denial_options IS 'Configurable content for transfer denied email [[TRANSFER_DENIAL_OPTIONS]]';
COMMENT ON COLUMN funds.exit_closing_message IS 'Configurable content for final exit statement email [[EXIT_CLOSING_MESSAGE]]';

-- ============================================================
-- RLS POLICIES FOR TRANSFER REQUESTS
-- ============================================================

-- Enable RLS on transfer_requests
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Fund managers can manage all transfer requests in their fund
CREATE POLICY transfer_requests_fund_manager_all ON transfer_requests
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Investors can view and create their own transfer requests
CREATE POLICY transfer_requests_investor_select ON transfer_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = transfer_requests.investor_id
      AND i.user_id = auth.uid()
    )
  );

CREATE POLICY transfer_requests_investor_insert ON transfer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = transfer_requests.investor_id
      AND i.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER FOR TRANSFER REQUESTS
-- ============================================================

CREATE TRIGGER update_transfer_requests_updated_at
  BEFORE UPDATE ON transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
