-- Migration: 042_reporting_tax_email_fields
-- Description: Add tables and fields for Stage 04 Reporting & Tax email flows
-- Date: 2026-01-18

-- ============================================================
-- FUND REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS fund_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  
  -- Report type and period
  report_type TEXT NOT NULL CHECK (report_type IN ('quarterly', 'annual')),
  period_year INT NOT NULL,
  period_quarter INT CHECK (period_quarter IS NULL OR period_quarter IN (1, 2, 3, 4)),
  
  -- Report content
  title TEXT NOT NULL,
  summary_content TEXT, -- HTML content for email summary (replaces [[QUARTERLY_REPORT_SUMMARY]] etc.)
  file_path TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  
  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_sent_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure quarterly reports have quarter, annual don't
  CONSTRAINT check_quarter_for_quarterly CHECK (
    (report_type = 'quarterly' AND period_quarter IS NOT NULL) OR
    (report_type = 'annual' AND period_quarter IS NULL)
  ),
  -- Unique constraint per fund/period
  CONSTRAINT unique_fund_report_period UNIQUE (fund_id, report_type, period_year, period_quarter)
);

-- Indexes for fund_reports
CREATE INDEX IF NOT EXISTS idx_fund_reports_fund_id ON fund_reports(fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_reports_status ON fund_reports(status);
CREATE INDEX IF NOT EXISTS idx_fund_reports_type_year ON fund_reports(report_type, period_year);

-- Comments for fund_reports
COMMENT ON TABLE fund_reports IS 'Tracks quarterly and annual fund reports for investor distribution';
COMMENT ON COLUMN fund_reports.summary_content IS 'HTML content for email summary - replaces [[QUARTERLY_REPORT_SUMMARY]] and [[ANNUAL_REPORT_SUMMARY]] placeholders';

-- ============================================================
-- INVESTOR MEETINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  
  -- Meeting details
  meeting_year INT NOT NULL,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  meeting_format TEXT NOT NULL CHECK (meeting_format IN ('in_person', 'virtual', 'hybrid')),
  
  -- Location/connection info
  location TEXT, -- For in-person or hybrid
  virtual_link TEXT, -- For virtual or hybrid
  
  -- Content
  agenda_preview TEXT, -- HTML content for email (replaces [[MEETING_AGENDA_PREVIEW]])
  
  -- RSVP tracking
  rsvp_url TEXT,
  rsvp_deadline DATE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'completed', 'cancelled')),
  
  -- Email tracking
  invite_sent_at TIMESTAMPTZ,
  invite_sent_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique annual meeting per fund/year
  CONSTRAINT unique_fund_meeting_year UNIQUE (fund_id, meeting_year)
);

-- Indexes for investor_meetings
CREATE INDEX IF NOT EXISTS idx_investor_meetings_fund_id ON investor_meetings(fund_id);
CREATE INDEX IF NOT EXISTS idx_investor_meetings_date ON investor_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_investor_meetings_status ON investor_meetings(status);

-- Comments for investor_meetings
COMMENT ON TABLE investor_meetings IS 'Tracks annual investor meetings and invitation status';
COMMENT ON COLUMN investor_meetings.agenda_preview IS 'HTML content for meeting agenda preview in invitation email';

-- ============================================================
-- K1 DOCUMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS k1_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  
  -- Tax year and document type
  tax_year INT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('final', 'estimate', 'amended')),
  
  -- File reference
  file_path TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Link to documents table if used
  
  -- Estimate-specific fields
  expected_final_date DATE, -- When final K-1 is expected (for estimates)
  
  -- Amendment-specific fields
  amendment_reason TEXT, -- Reason for amendment
  original_k1_id UUID REFERENCES k1_documents(id) ON DELETE SET NULL, -- Link to original K-1 being amended
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'sent', 'downloaded')),
  uploaded_at TIMESTAMPTZ,
  
  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: Partial unique constraint for k1_documents created below as CREATE UNIQUE INDEX

-- Indexes for k1_documents
CREATE INDEX IF NOT EXISTS idx_k1_documents_fund_id ON k1_documents(fund_id);
CREATE INDEX IF NOT EXISTS idx_k1_documents_investor_id ON k1_documents(investor_id);
CREATE INDEX IF NOT EXISTS idx_k1_documents_tax_year ON k1_documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_k1_documents_type ON k1_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_k1_documents_status ON k1_documents(status);

-- Partial unique constraint: only one final/estimate per investor/year, but allow multiple amendments
CREATE UNIQUE INDEX IF NOT EXISTS idx_k1_unique_per_investor_year_type 
  ON k1_documents(fund_id, investor_id, tax_year, document_type) 
  WHERE document_type != 'amended';

-- Comments for k1_documents
COMMENT ON TABLE k1_documents IS 'Tracks K-1 tax documents (final, estimates, amendments) per investor';
COMMENT ON COLUMN k1_documents.expected_final_date IS 'Expected date for final K-1 when this is an estimate';
COMMENT ON COLUMN k1_documents.amendment_reason IS 'Explanation of why K-1 was amended';

-- ============================================================
-- PROPERTY ANNOUNCEMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS property_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  
  -- Announcement type
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('acquisition', 'disposition')),
  
  -- Content
  summary_content TEXT NOT NULL, -- HTML content (replaces [[PROPERTY_ACQUISITION_SUMMARY]] or [[DISPOSITION_SUMMARY]])
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at TIMESTAMPTZ,
  
  -- Email tracking
  email_sent_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One announcement per deal/type
  CONSTRAINT unique_announcement_per_deal_type UNIQUE (deal_id, announcement_type)
);

-- Indexes for property_announcements
CREATE INDEX IF NOT EXISTS idx_property_announcements_fund_id ON property_announcements(fund_id);
CREATE INDEX IF NOT EXISTS idx_property_announcements_deal_id ON property_announcements(deal_id);
CREATE INDEX IF NOT EXISTS idx_property_announcements_type ON property_announcements(announcement_type);

-- Comments for property_announcements
COMMENT ON TABLE property_announcements IS 'Tracks property acquisition and disposition announcements';
COMMENT ON COLUMN property_announcements.summary_content IS 'HTML content for announcement email body';

-- ============================================================
-- EXTEND DEALS TABLE FOR DISPOSITION TRACKING
-- ============================================================

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS disposition_date DATE,
ADD COLUMN IF NOT EXISTS disposition_price DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS sale_summary_content TEXT;

-- Comments for new deals columns
COMMENT ON COLUMN deals.disposition_date IS 'Date the property was sold';
COMMENT ON COLUMN deals.disposition_price IS 'Final sale price of the property';
COMMENT ON COLUMN deals.sale_summary_content IS 'HTML content for disposition email summary';

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE fund_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE k1_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_announcements ENABLE ROW LEVEL SECURITY;

-- Fund Reports: Managers can manage, investors can view published
CREATE POLICY fund_reports_manager_all ON fund_reports
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY fund_reports_investor_select ON fund_reports
  FOR SELECT
  TO authenticated
  USING (
    status = 'published' AND
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.fund_id = fund_reports.fund_id
      AND i.user_id = auth.uid()
    )
  );

-- Investor Meetings: Managers can manage, investors can view
CREATE POLICY investor_meetings_manager_all ON investor_meetings
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY investor_meetings_investor_select ON investor_meetings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.fund_id = investor_meetings.fund_id
      AND i.user_id = auth.uid()
    )
  );

-- K1 Documents: Managers can manage all, investors can view their own
CREATE POLICY k1_documents_manager_all ON k1_documents
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY k1_documents_investor_select ON k1_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.id = k1_documents.investor_id
      AND i.user_id = auth.uid()
    )
  );

-- Property Announcements: Managers can manage, investors can view sent
CREATE POLICY property_announcements_manager_all ON property_announcements
  FOR ALL
  TO authenticated
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY property_announcements_investor_select ON property_announcements
  FOR SELECT
  TO authenticated
  USING (
    status = 'sent' AND
    EXISTS (
      SELECT 1 FROM investors i
      WHERE i.fund_id = property_announcements.fund_id
      AND i.user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_fund_reports_updated_at
  BEFORE UPDATE ON fund_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investor_meetings_updated_at
  BEFORE UPDATE ON investor_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_k1_documents_updated_at
  BEFORE UPDATE ON k1_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
