-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_call_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers can view fund users" ON users
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Funds policies
CREATE POLICY "Users can view their fund" ON funds
  FOR SELECT USING (
    id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Managers can manage their fund" ON funds
  FOR ALL USING (
    id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Investors policies
CREATE POLICY "Investors can view own data" ON investors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view fund investors" ON investors
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Accountants can view fund investors" ON investors
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'accountant'
    )
  );

CREATE POLICY "Managers can manage fund investors" ON investors
  FOR ALL USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Deals policies
CREATE POLICY "Users can view fund deals" ON deals
  FOR SELECT USING (
    fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Managers can manage fund deals" ON deals
  FOR ALL USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Investor-Deals policies
CREATE POLICY "Investors can view own deals" ON investor_deals
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
  );

CREATE POLICY "Managers can view fund investor deals" ON investor_deals
  FOR SELECT USING (
    investor_id IN (
      SELECT id FROM investors WHERE fund_id IN (
        SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
      )
    )
  );

CREATE POLICY "Managers can manage investor deals" ON investor_deals
  FOR ALL USING (
    investor_id IN (
      SELECT id FROM investors WHERE fund_id IN (
        SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
      )
    )
  );

-- Documents policies
CREATE POLICY "Investors can view own documents" ON documents
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
    OR visible_to @> ARRAY[(SELECT role FROM users WHERE id = auth.uid())]
  );

CREATE POLICY "Managers can view fund documents" ON documents
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Attorneys can view fund documents" ON documents
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'attorney'
    )
  );

CREATE POLICY "Managers can manage fund documents" ON documents
  FOR ALL USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Attorneys can manage fund documents" ON documents
  FOR ALL USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'attorney'
    )
  );

-- Capital Calls policies
CREATE POLICY "Investors can view own capital calls" ON capital_calls
  FOR SELECT USING (
    id IN (
      SELECT capital_call_id FROM capital_call_items
      WHERE investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Managers can view fund capital calls" ON capital_calls
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can manage fund capital calls" ON capital_calls
  FOR ALL USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Capital Call Items policies
CREATE POLICY "Investors can view own capital call items" ON capital_call_items
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
  );

CREATE POLICY "Managers can view fund capital call items" ON capital_call_items
  FOR SELECT USING (
    capital_call_id IN (
      SELECT id FROM capital_calls WHERE fund_id IN (
        SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
      )
    )
  );

CREATE POLICY "Managers can update capital call items" ON capital_call_items
  FOR UPDATE USING (
    capital_call_id IN (
      SELECT id FROM capital_calls WHERE fund_id IN (
        SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
      )
    )
  );

-- Email Logs policies
CREATE POLICY "Managers can view fund email logs" ON email_logs
  FOR SELECT USING (
    fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Investors can view own email logs" ON email_logs
  FOR SELECT USING (
    investor_id IN (SELECT id FROM investors WHERE user_id = auth.uid())
  );

-- Audit Logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view fund audit logs" ON audit_logs
  FOR SELECT USING (
    entity_id IN (
      SELECT id FROM funds WHERE id IN (
        SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
      )
    )
  );

