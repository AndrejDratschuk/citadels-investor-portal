-- Add new notification types for investor messages and communications
-- This migration updates the CHECK constraint on the notifications.type column

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the new constraint with additional types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'investor_added',
  'investor_updated', 
  'investor_onboarded',
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
  'investor_message',
  'new_communication',
  'document_uploaded',
  'document_signed'
));

COMMENT ON COLUMN notifications.type IS 'Type of notification - includes investor_message (investor->manager) and new_communication (manager->investor)';



