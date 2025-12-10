-- Add read status and tags columns to investor_communications table
-- for tracking per-investor read state and personal tagging

-- Add is_read column to track if investor has read the communication
ALTER TABLE investor_communications 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add read_at timestamp to track when the communication was read
ALTER TABLE investor_communications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add tags column for investor-side tagging/organization
ALTER TABLE investor_communications 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for efficient filtering by read status
CREATE INDEX IF NOT EXISTS idx_communications_is_read ON investor_communications(is_read);

-- Create index for efficient filtering by tags (GIN index for array)
CREATE INDEX IF NOT EXISTS idx_communications_tags ON investor_communications USING GIN(tags);

-- Comment on columns for documentation
COMMENT ON COLUMN investor_communications.is_read IS 'Whether the investor has read this communication';
COMMENT ON COLUMN investor_communications.read_at IS 'Timestamp when the investor marked this communication as read';
COMMENT ON COLUMN investor_communications.tags IS 'User-defined tags for organizing communications';

