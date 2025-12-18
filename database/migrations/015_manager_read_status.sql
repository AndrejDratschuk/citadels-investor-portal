-- Add manager_read column to track if manager has seen the communication
-- This separates the read status: is_read is for investors, manager_read is for managers

-- Add manager_read column to track if manager has read the communication
ALTER TABLE investor_communications 
ADD COLUMN IF NOT EXISTS manager_read BOOLEAN DEFAULT FALSE;

-- Add manager_read_at timestamp to track when the manager read the communication
ALTER TABLE investor_communications 
ADD COLUMN IF NOT EXISTS manager_read_at TIMESTAMPTZ;

-- Create index for efficient filtering by manager read status
CREATE INDEX IF NOT EXISTS idx_communications_manager_read 
ON investor_communications(manager_read);

-- Create index for filtering unread communications for managers
CREATE INDEX IF NOT EXISTS idx_communications_manager_unread 
ON investor_communications(fund_id, manager_read) WHERE manager_read = false;

-- Comment on columns for documentation
COMMENT ON COLUMN investor_communications.manager_read IS 'Whether the fund manager has read this communication';
COMMENT ON COLUMN investor_communications.manager_read_at IS 'Timestamp when the fund manager marked this communication as read';

