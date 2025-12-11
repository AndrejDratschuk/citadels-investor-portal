-- Add document categorization and status fields
-- This supports Fund Documents feature and enhanced upload modal

-- Add category column (fund, deal, investor)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('fund', 'deal', 'investor')) DEFAULT 'deal';

-- Add department/functional type column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS department TEXT CHECK (department IN ('tax', 'finance', 'marketing', 'strategy', 'operations', 'legal', 'compliance'));

-- Add document status (affects visibility)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('draft', 'review', 'final')) DEFAULT 'final';

-- Add custom tags array
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update comments
COMMENT ON COLUMN documents.category IS 'Document category: fund (fund-level), deal (deal-specific), investor (investor-specific)';
COMMENT ON COLUMN documents.department IS 'Functional area: tax, finance, marketing, strategy, operations, legal, compliance';
COMMENT ON COLUMN documents.status IS 'Document status: draft/review (manager only), final (visible to investors)';
COMMENT ON COLUMN documents.tags IS 'Custom user-defined tags for organization';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Update existing documents to have appropriate category based on existing data
UPDATE documents SET category = 'deal' WHERE deal_id IS NOT NULL AND investor_id IS NULL;
UPDATE documents SET category = 'investor' WHERE investor_id IS NOT NULL;
UPDATE documents SET category = 'fund' WHERE deal_id IS NULL AND investor_id IS NULL;

