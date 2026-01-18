-- Migration: Prospect Email Fields
-- Description: Adds fields required for the Stage 01 prospect email flows
--              including fund settings, team credentials, and prospect tracking

-- ============================================================================
-- 1. Add email configuration fields to funds table
-- ============================================================================

-- Platform branding
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS platform_name TEXT DEFAULT 'Lionshare';

-- Fund timezone for email scheduling and display (IANA format)
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Investment descriptor for email copy (e.g., "in South Florida multifamily real estate")
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS investment_brief_descriptor TEXT;

-- Pre-meeting materials configuration
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS pre_meeting_materials_type TEXT 
CHECK (pre_meeting_materials_type IN ('website', 'teaser_doc'));

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS pre_meeting_materials_url TEXT;

-- Accreditation education configuration
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS accreditation_education_type TEXT 
CHECK (accreditation_education_type IN ('standard_video', 'custom_text'))
DEFAULT 'standard_video';

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS accreditation_education_content TEXT;

-- Post-meeting email customization
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS post_meeting_recap_template TEXT 
DEFAULT 'It was great learning about your investment objectives.';

-- Nurture email customization
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS considering_support_message TEXT 
DEFAULT 'I''m available whenever you have questions—just reply or schedule time.';

-- Array of market/fund update snippets for nurture emails
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS nurture_update_templates JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- 2. Add credentials field to users table (for team members)
-- ============================================================================

-- Professional credentials (e.g., "CAIA" outputs "Jay McHale, CAIA")
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credentials TEXT;

-- ============================================================================
-- 3. Add tracking fields to kyc_applications (prospects) table
-- ============================================================================

-- When manager marked prospect as "Considering"
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS considering_at TIMESTAMPTZ;

-- Manager's post-meeting notes/bullet points
ALTER TABLE kyc_applications 
ADD COLUMN IF NOT EXISTS meeting_recap_bullets TEXT;

-- ============================================================================
-- 4. Update status constraint to include new statuses
-- ============================================================================

-- Drop existing constraint
ALTER TABLE kyc_applications 
DROP CONSTRAINT IF EXISTS kyc_applications_status_check;

-- Add updated constraint with CONSIDERING and NOT_A_FIT statuses
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
  'considering',
  'not_a_fit',
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
-- 5. Create indexes for new fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_kyc_applications_considering_at 
ON kyc_applications(considering_at) 
WHERE considering_at IS NOT NULL;


