-- Migration: Deal Notes and Milestones
-- Adds communication hub and timeline planning features to deals

-- ============================================
-- 1. Deal Notes Table (Communication Hub)
-- ============================================
CREATE TABLE deal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  visibility JSONB NOT NULL DEFAULT '["manager"]',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Deal Milestones Table (Timeline Planning)
-- ============================================
CREATE TABLE deal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed')),
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('acquisition', 'renovation', 'financing', 'operations', 'disposition', 'other')),
  actual_completion_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Indexes for Performance
-- ============================================
CREATE INDEX idx_deal_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX idx_deal_notes_fund_id ON deal_notes(fund_id);
CREATE INDEX idx_deal_notes_created_at ON deal_notes(created_at DESC);

CREATE INDEX idx_deal_milestones_deal_id ON deal_milestones(deal_id);
CREATE INDEX idx_deal_milestones_fund_id ON deal_milestones(fund_id);
CREATE INDEX idx_deal_milestones_start_date ON deal_milestones(start_date);
CREATE INDEX idx_deal_milestones_status ON deal_milestones(status);

-- ============================================
-- 4. Row Level Security
-- ============================================
ALTER TABLE deal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_milestones ENABLE ROW LEVEL SECURITY;

-- Deal Notes: Managers can manage all notes for their fund
CREATE POLICY "managers_full_access_notes"
  ON deal_notes
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Deal Notes: Other roles can view notes where they are in visibility array
CREATE POLICY "role_based_view_notes"
  ON deal_notes
  FOR SELECT
  USING (
    fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
    AND (
      visibility ? (SELECT role FROM users WHERE id = auth.uid())
      OR (SELECT role FROM users WHERE id = auth.uid()) = 'manager'
    )
  );

-- Deal Notes: Service role bypass
CREATE POLICY "service_role_bypass_notes"
  ON deal_notes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Deal Milestones: Managers can manage all milestones for their fund
CREATE POLICY "managers_full_access_milestones"
  ON deal_milestones
  FOR ALL
  USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Deal Milestones: All fund users can view milestones
CREATE POLICY "fund_users_view_milestones"
  ON deal_milestones
  FOR SELECT
  USING (
    fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  );

-- Deal Milestones: Service role bypass
CREATE POLICY "service_role_bypass_milestones"
  ON deal_milestones
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 5. Updated_at Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_deal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_notes_updated_at
  BEFORE UPDATE ON deal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_notes_updated_at();

CREATE OR REPLACE FUNCTION update_deal_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_milestones_updated_at
  BEFORE UPDATE ON deal_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_milestones_updated_at();

-- ============================================
-- 6. Comments for Documentation
-- ============================================
COMMENT ON TABLE deal_notes IS 'Communication hub for deal-specific notes with role-based visibility';
COMMENT ON COLUMN deal_notes.visibility IS 'JSONB array of roles that can view this note: manager, accountant, attorney, investor';

COMMENT ON TABLE deal_milestones IS 'Timeline planning with milestones for deal lifecycle tracking';
COMMENT ON COLUMN deal_milestones.end_date IS 'NULL for single-day events, set for date ranges';
COMMENT ON COLUMN deal_milestones.actual_completion_date IS 'For forecast vs actual comparison';

