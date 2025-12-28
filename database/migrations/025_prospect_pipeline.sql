-- Migration: Prospect Pipeline System
-- Description: Enhances kyc_applications table to serve as the full pipeline tracker
--              and updates investors table for clean investor list

-- ============================================================================
-- 1. Add new columns to kyc_applications for pipeline tracking
-- ============================================================================

-- Source tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('manual', 'website', 'interest_form'));

-- Fund manager who sent the KYC
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Internal notes
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Unique token for manual sends
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS kyc_link_token TEXT UNIQUE;

-- Meeting tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS meeting_completed_at TIMESTAMPTZ;

-- Onboarding tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMPTZ;

-- Document validation tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS documents_approved_at TIMESTAMPTZ;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS documents_rejected_at TIMESTAMPTZ;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS document_rejection_reason TEXT;

-- DocuSign tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS docusign_sent_at TIMESTAMPTZ;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS docusign_signed_at TIMESTAMPTZ;

-- Conversion tracking
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS converted_to_investor BOOLEAN DEFAULT false;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES investors(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. Update status constraint on kyc_applications
-- ============================================================================

-- Drop existing constraint
ALTER TABLE kyc_applications 
DROP CONSTRAINT IF EXISTS kyc_applications_status_check;

-- Add updated constraint with all pipeline statuses
ALTER TABLE kyc_applications 
ADD CONSTRAINT kyc_applications_status_check 
CHECK (status IN (
  'draft',
  'kyc_sent',
  'submitted',
  'kyc_submitted', 
  'pre_qualified', 
  'not_eligible',
  'meeting_scheduled', 
  'meeting_complete',
  'account_invite_sent', 
  'account_created',
  'onboarding_submitted',
  'documents_pending',
  'documents_approved', 
  'documents_rejected',
  'docusign_sent', 
  'docusign_signed',
  'converted'
));

-- ============================================================================
-- 3. Update investors table for clean investor list
-- ============================================================================

-- Drop existing constraint
ALTER TABLE investors 
DROP CONSTRAINT IF EXISTS investors_status_check;

-- Add updated constraint with all existing statuses
ALTER TABLE investors 
ADD CONSTRAINT investors_status_check 
CHECK (status IN ('active', 'inactive', 'exited', 'prospect', 'onboarding'));

-- Add prospect reference
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES kyc_applications(id) ON DELETE SET NULL;

-- Ensure onboarded_at column exists
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- ============================================================================
-- 4. Create indexes for pipeline queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_kyc_applications_source ON kyc_applications(source);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_sent_by ON kyc_applications(sent_by);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_kyc_link_token ON kyc_applications(kyc_link_token);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_converted ON kyc_applications(converted_to_investor);
CREATE INDEX IF NOT EXISTS idx_investors_prospect_id ON investors(prospect_id);

-- ============================================================================
-- 5. Migrate existing data - update source for existing records
-- ============================================================================

-- Set default source for existing records without a source
UPDATE kyc_applications 
SET source = 'website' 
WHERE source IS NULL;

-- ============================================================================
-- 6. RLS Policies for new columns
-- ============================================================================

-- Fund managers can view and manage prospects in their fund
-- (Existing RLS policies on kyc_applications should already handle this,
-- but let's ensure they work with the new columns)

-- Drop and recreate policy to ensure it covers all columns
DROP POLICY IF EXISTS managers_view_kyc_applications ON kyc_applications;
DROP POLICY IF EXISTS managers_manage_kyc_applications ON kyc_applications;

CREATE POLICY managers_view_kyc_applications ON kyc_applications
  FOR SELECT
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY managers_manage_kyc_applications ON kyc_applications
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- 7. Function to get pipeline stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pipeline_stats(p_fund_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_prospects', COUNT(*),
    'kyc_sent', COUNT(*) FILTER (WHERE status = 'kyc_sent'),
    'kyc_submitted', COUNT(*) FILTER (WHERE status IN ('submitted', 'kyc_submitted')),
    'pre_qualified', COUNT(*) FILTER (WHERE status = 'pre_qualified'),
    'meetings_scheduled', COUNT(*) FILTER (WHERE status = 'meeting_scheduled'),
    'meetings_completed', COUNT(*) FILTER (WHERE status = 'meeting_complete'),
    'onboarding_in_progress', COUNT(*) FILTER (WHERE status IN ('account_invite_sent', 'account_created', 'onboarding_submitted')),
    'documents_pending', COUNT(*) FILTER (WHERE status = 'documents_pending'),
    'documents_approved', COUNT(*) FILTER (WHERE status = 'documents_approved'),
    'docusign_pending', COUNT(*) FILTER (WHERE status = 'docusign_sent'),
    'ready_to_convert', COUNT(*) FILTER (WHERE status = 'docusign_signed'),
    'converted', COUNT(*) FILTER (WHERE status = 'converted')
  ) INTO result
  FROM kyc_applications
  WHERE fund_id = p_fund_id
    AND status != 'not_eligible';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

