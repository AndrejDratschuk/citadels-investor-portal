-- Notifications table
-- Stores real-time notifications for users

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  
  -- Notification type and category
  type TEXT NOT NULL CHECK (type IN (
    'investor_added',
    'investor_updated', 
    'kyc_submitted',
    'kyc_approved',
    'kyc_rejected',
    'capital_call_created',
    'capital_call_payment_received',
    'capital_call_completed',
    'deal_created',
    'deal_updated',
    'deal_status_changed',
    'communication_received',
    'document_uploaded',
    'document_signed'
  )),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity references
  related_entity_type TEXT CHECK (related_entity_type IN ('investor', 'deal', 'capital_call', 'document', 'communication', 'kyc_application')),
  related_entity_id UUID,
  
  -- Metadata (JSON for flexible additional data)
  metadata JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for faster queries
  CONSTRAINT valid_read_state CHECK (
    (is_read = false AND read_at IS NULL) OR
    (is_read = true AND read_at IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_fund_id ON notifications(fund_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications (from backend)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Service role can delete notifications
CREATE POLICY "Service role can delete notifications"
  ON notifications FOR DELETE
  USING (true);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_fund_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    fund_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    metadata
  ) VALUES (
    p_user_id,
    p_fund_id,
    p_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_metadata
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all fund managers when something happens
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
  -- Get all managers for this fund
  FOR v_manager IN 
    SELECT user_id FROM fund_users WHERE fund_id = p_fund_id AND role = 'manager'
  LOOP
    PERFORM create_notification(
      v_manager.user_id,
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

-- Trigger function for new investor notification
CREATE OR REPLACE FUNCTION notify_on_investor_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_fund_managers(
    NEW.fund_id,
    'investor_added',
    'New Investor Added',
    'A new investor ' || COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email) || ' has been added.',
    'investor',
    NEW.id,
    jsonb_build_object('investor_email', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new investor
DROP TRIGGER IF EXISTS trigger_notify_investor_created ON investors;
CREATE TRIGGER trigger_notify_investor_created
  AFTER INSERT ON investors
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_investor_created();

-- Trigger function for KYC submission
CREATE OR REPLACE FUNCTION notify_on_kyc_submitted()
RETURNS TRIGGER AS $$
DECLARE
  v_investor RECORD;
BEGIN
  IF NEW.status = 'submitted' AND (OLD IS NULL OR OLD.status != 'submitted') THEN
    SELECT * INTO v_investor FROM investors WHERE id = NEW.investor_id;
    
    IF v_investor IS NOT NULL THEN
      PERFORM notify_fund_managers(
        v_investor.fund_id,
        'kyc_submitted',
        'KYC Application Submitted',
        COALESCE(v_investor.first_name || ' ' || v_investor.last_name, v_investor.email) || ' submitted their KYC application for review.',
        'kyc_application',
        NEW.id,
        jsonb_build_object('investor_id', NEW.investor_id, 'investor_email', v_investor.email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for KYC submission
DROP TRIGGER IF EXISTS trigger_notify_kyc_submitted ON kyc_applications;
CREATE TRIGGER trigger_notify_kyc_submitted
  AFTER INSERT OR UPDATE ON kyc_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_kyc_submitted();

-- Trigger function for new deal
CREATE OR REPLACE FUNCTION notify_on_deal_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_fund_managers(
    NEW.fund_id,
    'deal_created',
    'New Deal Created',
    'A new deal "' || NEW.name || '" has been added to the portfolio.',
    'deal',
    NEW.id,
    jsonb_build_object('deal_name', NEW.name, 'property_type', NEW.property_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new deal
DROP TRIGGER IF EXISTS trigger_notify_deal_created ON deals;
CREATE TRIGGER trigger_notify_deal_created
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_deal_created();

-- Trigger function for deal status change
CREATE OR REPLACE FUNCTION notify_on_deal_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    PERFORM notify_fund_managers(
      NEW.fund_id,
      'deal_status_changed',
      'Deal Status Updated',
      'Deal "' || NEW.name || '" status changed from ' || OLD.status || ' to ' || NEW.status || '.',
      'deal',
      NEW.id,
      jsonb_build_object('deal_name', NEW.name, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for deal status change
DROP TRIGGER IF EXISTS trigger_notify_deal_status_changed ON deals;
CREATE TRIGGER trigger_notify_deal_status_changed
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_deal_status_changed();

-- Trigger function for new communication
CREATE OR REPLACE FUNCTION notify_on_communication_created()
RETURNS TRIGGER AS $$
DECLARE
  v_investor RECORD;
BEGIN
  -- Only notify for incoming communications (from investors to managers)
  IF NEW.direction = 'incoming' THEN
    SELECT * INTO v_investor FROM investors WHERE id = NEW.investor_id;
    
    IF v_investor IS NOT NULL THEN
      PERFORM notify_fund_managers(
        v_investor.fund_id,
        'communication_received',
        'New Communication',
        'New ' || NEW.type || ' received from ' || COALESCE(v_investor.first_name || ' ' || v_investor.last_name, v_investor.email) || '.',
        'communication',
        NEW.id,
        jsonb_build_object('investor_id', NEW.investor_id, 'communication_type', NEW.type, 'subject', NEW.subject)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new communication
DROP TRIGGER IF EXISTS trigger_notify_communication_created ON communications;
CREATE TRIGGER trigger_notify_communication_created
  AFTER INSERT ON communications
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_communication_created();

COMMENT ON TABLE notifications IS 'Real-time notifications for users about various events';

