-- Migration: Investor Account Creation & Document Validation Flow
-- Description: Adds support for account creation tokens, email verification codes,
--              document validation status, and updated status enums.

-- ============================================================================
-- 1. Account Creation Tokens Table
-- ============================================================================
-- Stores tokens sent to investors after meeting approval to create their accounts
CREATE TABLE IF NOT EXISTS account_creation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_application_id UUID REFERENCES kyc_applications(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_tokens_token ON account_creation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_account_tokens_kyc ON account_creation_tokens(kyc_application_id);
CREATE INDEX IF NOT EXISTS idx_account_tokens_email ON account_creation_tokens(email);

-- ============================================================================
-- 2. Email Verification Codes Table
-- ============================================================================
-- Stores 2FA codes for account creation, password reset, and login verification
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('account_creation', 'password_reset', 'login')),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_email_purpose ON email_verification_codes(email, purpose);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_codes(expires_at);

-- ============================================================================
-- 3. Extend Documents Table for Validation Workflow
-- ============================================================================
-- Add subcategory for document organization
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add uploaded_by to track who uploaded the document
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uploaded_by TEXT CHECK (uploaded_by IN ('investor', 'fund_manager', 'docusign_auto', 'system'));

-- Add validation_status for approval workflow
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS validation_status TEXT CHECK (validation_status IN ('pending', 'approved', 'rejected'));

-- Add validated_by to track who approved/rejected
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id);

-- Add validated_at timestamp
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- Add rejection_reason for rejected documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add file_size for validation
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Add mime_type for file type validation
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Create indexes for validation queries
CREATE INDEX IF NOT EXISTS idx_documents_validation_status ON documents(validation_status);
CREATE INDEX IF NOT EXISTS idx_documents_subcategory ON documents(subcategory);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ============================================================================
-- 4. Update Investors Status Enum
-- ============================================================================
-- Drop existing constraint if exists
ALTER TABLE investors 
DROP CONSTRAINT IF EXISTS investors_status_check;

-- Add updated constraint with new statuses for account flow
ALTER TABLE investors 
ADD CONSTRAINT investors_status_check 
CHECK (status IN (
  'prospect',           -- Initial state (from KYC)
  'kyc_submitted',      -- KYC form submitted
  'account_created',    -- Account created, ready for onboarding
  'onboarding',         -- Currently in onboarding process
  'pending_validation', -- Documents submitted, awaiting review
  'active',             -- Fully approved investor
  'inactive'            -- Deactivated investor
));

-- ============================================================================
-- 5. Update KYC Applications Status Enum
-- ============================================================================
-- Drop existing constraint if exists
ALTER TABLE kyc_applications 
DROP CONSTRAINT IF EXISTS kyc_applications_status_check;

-- Add updated constraint with account invite status
ALTER TABLE kyc_applications 
ADD CONSTRAINT kyc_applications_status_check 
CHECK (status IN (
  'draft',              -- Started but not submitted
  'submitted',          -- Submitted for review
  'pre_qualified',      -- Approved (meeting can be scheduled)
  'not_eligible',       -- Rejected
  'meeting_scheduled',  -- Meeting booked via Calendly
  'meeting_complete',   -- Meeting completed
  'account_invite_sent',-- Create account email sent
  'account_created'     -- Account has been created
));

-- ============================================================================
-- 6. RLS Policies for New Tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE account_creation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Account creation tokens: only fund managers can create/view
CREATE POLICY managers_manage_account_tokens ON account_creation_tokens
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Email verification codes: accessible by the email owner (for verification) 
-- and fund managers (for creation)
CREATE POLICY verification_codes_access ON email_verification_codes
  FOR ALL
  USING (true) -- Public access needed for verification during signup
  WITH CHECK (true);

-- ============================================================================
-- 7. Enhanced RLS Policies for Documents
-- ============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS investors_view_own_documents ON documents;
DROP POLICY IF EXISTS managers_view_fund_documents ON documents;

-- Investors can view their own documents
CREATE POLICY investors_view_own_documents ON documents
  FOR SELECT
  USING (
    investor_id IN (
      SELECT id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Investors can insert their own validation documents during onboarding
CREATE POLICY investors_insert_validation_docs ON documents
  FOR INSERT
  WITH CHECK (
    investor_id IN (
      SELECT id FROM investors WHERE user_id = auth.uid()
    )
    AND subcategory = 'validation'
    AND uploaded_by = 'investor'
  );

-- Investors cannot delete validation documents after they have a status
CREATE POLICY investors_no_delete_submitted_validation ON documents
  FOR DELETE
  USING (
    NOT (subcategory = 'validation' AND validation_status IS NOT NULL)
    AND investor_id IN (
      SELECT id FROM investors WHERE user_id = auth.uid()
    )
  );

-- Fund managers can view all documents in their fund
CREATE POLICY managers_view_fund_documents ON documents
  FOR SELECT
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Fund managers can update documents (for approval/rejection)
CREATE POLICY managers_update_fund_documents ON documents
  FOR UPDATE
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Fund managers can insert documents
CREATE POLICY managers_insert_fund_documents ON documents
  FOR INSERT
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- 8. Helper Functions
-- ============================================================================

-- Function to clean up expired verification codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired account tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_account_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM account_creation_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day'
  AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

