-- Add investment_goals_other column to kyc_applications table
-- This stores custom text when user selects "Other" in Investment Goals

ALTER TABLE kyc_applications
ADD COLUMN IF NOT EXISTS investment_goals_other TEXT;

COMMENT ON COLUMN kyc_applications.investment_goals_other IS 'Custom text for "Other" investment goal option';

-- Add investor_id column to link KYC applications to created investors
ALTER TABLE kyc_applications
ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES investors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kyc_applications_investor_id ON kyc_applications(investor_id);

COMMENT ON COLUMN kyc_applications.investor_id IS 'Reference to investor record created from this KYC application';

