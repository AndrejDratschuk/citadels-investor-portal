-- Fix notify_fund_managers function to use correct table
-- The original used fund_users which doesn't exist
-- Managers are stored in the users table with role = 'manager'

CREATE OR REPLACE FUNCTION notify_fund_managers(
  p_fund_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
  v_manager RECORD;
BEGIN
  -- Get all managers for this fund from the users table
  FOR v_manager IN 
    SELECT id FROM users WHERE fund_id = p_fund_id AND role = 'manager'
  LOOP
    PERFORM create_notification(
      v_manager.id,
      p_fund_id,
      p_type,
      p_title,
      p_message,
      p_related_entity_type,
      p_related_entity_id,
      p_metadata
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_fund_managers IS 'Notify all fund managers - fixed to use users table instead of non-existent fund_users table';

