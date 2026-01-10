-- Investor Communications table for tracking emails, meetings, and phone calls
CREATE TABLE investor_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE NOT NULL,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  
  type TEXT NOT NULL CHECK (type IN ('email', 'meeting', 'phone_call')),
  
  -- Common fields
  title TEXT NOT NULL,
  content TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  
  -- Email-specific
  email_from TEXT,
  email_to TEXT,
  
  -- Meeting-specific (from AI note-taker)
  meeting_attendees TEXT[],
  meeting_duration_minutes INT,
  
  -- Phone call specific
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  call_duration_minutes INT,
  
  -- Metadata
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'email_sync', 'ai_notetaker')),
  external_id TEXT, -- For deduplication of synced items
  
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_communications_investor_id ON investor_communications(investor_id);
CREATE INDEX idx_communications_fund_id ON investor_communications(fund_id);
CREATE INDEX idx_communications_type ON investor_communications(type);
CREATE INDEX idx_communications_occurred_at ON investor_communications(occurred_at DESC);
































