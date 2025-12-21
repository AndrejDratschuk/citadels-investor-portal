-- Migration: Create transactional function for KYC approval
-- This ensures investor creation and KYC status update happen atomically

CREATE OR REPLACE FUNCTION approve_kyc_application(
  p_kyc_id UUID,
  p_fund_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_address JSONB DEFAULT NULL,
  p_entity_type TEXT DEFAULT 'individual',
  p_entity_name TEXT DEFAULT NULL,
  p_commitment_amount NUMERIC DEFAULT 0,
  p_accreditation_type TEXT DEFAULT NULL
)
RETURNS TABLE(investor_id UUID, kyc_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_investor_id UUID;
  v_kyc_status TEXT;
  v_current_status TEXT;
BEGIN
  -- Check current KYC status
  SELECT status INTO v_current_status
  FROM kyc_applications
  WHERE id = p_kyc_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'KYC application not found: %', p_kyc_id;
  END IF;

  IF v_current_status NOT IN ('submitted', 'meeting_scheduled', 'meeting_complete') THEN
    RAISE EXCEPTION 'Cannot approve application with status: %', v_current_status;
  END IF;

  -- Check if investor already exists for this KYC
  SELECT investor_id INTO v_investor_id
  FROM kyc_applications
  WHERE id = p_kyc_id;

  -- Create investor if not exists
  IF v_investor_id IS NULL THEN
    INSERT INTO investors (
      fund_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      entity_type,
      entity_name,
      commitment_amount,
      accreditation_status,
      accreditation_type,
      status,
      onboarding_step
    ) VALUES (
      p_fund_id,
      p_first_name,
      p_last_name,
      p_email,
      p_phone,
      p_address,
      p_entity_type,
      p_entity_name,
      p_commitment_amount,
      'pending',
      p_accreditation_type,
      'prospect',
      1
    )
    RETURNING id INTO v_investor_id;
  END IF;

  -- Update KYC application status
  UPDATE kyc_applications
  SET 
    status = 'pre_qualified',
    investor_id = v_investor_id,
    updated_at = NOW()
  WHERE id = p_kyc_id
  RETURNING status INTO v_kyc_status;

  RETURN QUERY SELECT v_investor_id, v_kyc_status;
END;
$$;

-- Grant execute permission to authenticated users (managers will be checked in app layer)
GRANT EXECUTE ON FUNCTION approve_kyc_application TO authenticated;

COMMENT ON FUNCTION approve_kyc_application IS 
'Atomically creates an investor record and approves a KYC application. 
If either operation fails, both are rolled back to prevent orphan records.';

