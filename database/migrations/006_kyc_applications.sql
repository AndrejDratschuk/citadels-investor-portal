-- Onboarding Applications table (for Form 2 - Investor Application)
CREATE TABLE IF NOT EXISTS onboarding_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  data JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_applications_fund_id ON onboarding_applications(fund_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_applications_invite_code ON onboarding_applications(invite_code);

-- KYC Applications table for pre-qualification form (Form 1)
CREATE TABLE IF NOT EXISTS kyc_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  
  -- Investor Type
  investor_category TEXT NOT NULL CHECK (investor_category IN ('individual', 'entity')),
  investor_type TEXT NOT NULL, -- 'hnw', 'joint', 'foreign_individual', 'corp_llc', 'trust', etc.
  
  -- Identity (Individual)
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  postal_code TEXT,
  
  -- Identity (Entity)
  entity_legal_name TEXT,
  country_of_formation TEXT,
  state_of_formation TEXT,
  authorized_signer_first_name TEXT,
  authorized_signer_last_name TEXT,
  authorized_signer_title TEXT,
  work_email TEXT,
  work_phone TEXT,
  principal_office_city TEXT,
  principal_office_state TEXT,
  principal_office_country TEXT,
  
  -- Accreditation (JSONB array of selected option IDs)
  accreditation_bases JSONB DEFAULT '[]',
  
  -- Investment Intent
  indicative_commitment DECIMAL(15,2),
  timeline TEXT CHECK (timeline IN ('asap', '30_60_days', '60_90_days', 'over_90_days')),
  investment_goals JSONB DEFAULT '[]',
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')),
  questions_for_manager TEXT,
  
  -- Consent
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'phone', 'sms', 'whatsapp', 'other')),
  consent_given BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pre_qualified', 'not_eligible', 'meeting_scheduled', 'meeting_complete')),
  calendly_event_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_kyc_applications_fund_id ON kyc_applications(fund_id);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_email ON kyc_applications(email);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_status ON kyc_applications(status);

-- Add kyc_application_id to onboarding_applications to link Form 1 to Form 2
ALTER TABLE onboarding_applications 
ADD COLUMN IF NOT EXISTS kyc_application_id UUID REFERENCES kyc_applications(id) ON DELETE SET NULL;

-- Add banking information columns to investors table
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS distribution_method TEXT CHECK (distribution_method IN ('wire', 'ach', 'check')),
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_address TEXT,
ADD COLUMN IF NOT EXISTS routing_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS account_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT CHECK (account_type IN ('checking', 'savings')),
ADD COLUMN IF NOT EXISTS beneficiary_name TEXT,
ADD COLUMN IF NOT EXISTS beneficiary_info TEXT;

