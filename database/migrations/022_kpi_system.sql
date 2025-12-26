-- KPI System Tables and Seed Data
-- Migration: 022_kpi_system.sql

-- ============================================
-- 1. KPI Definitions (Master list of all KPIs)
-- ============================================
CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'rent_revenue', 'occupancy', 'property_performance', 'financial', 'debt_service'
  )),
  description TEXT,
  format TEXT NOT NULL CHECK (format IN ('currency', 'percentage', 'number', 'ratio')),
  formula TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. KPI Preferences (Fund customization)
-- ============================================
CREATE TABLE kpi_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fund_id, kpi_id)
);

-- ============================================
-- 3. KPI Data (Actual values with time dimensions)
-- ============================================
CREATE TABLE kpi_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  kpi_id UUID REFERENCES kpi_definitions(id) ON DELETE CASCADE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_date DATE NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('actual', 'forecast', 'budget')),
  value DECIMAL(18,4) NOT NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheets', 'excel')),
  source_ref TEXT,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(deal_id, kpi_id, period_type, period_date, data_type)
);

-- ============================================
-- 4. Financial Statements (Optional statement data)
-- ============================================
CREATE TABLE financial_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  statement_type TEXT NOT NULL CHECK (statement_type IN ('income', 'balance_sheet', 'cash_flow')),
  period_date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheets', 'excel')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(deal_id, statement_type, period_date)
);

-- ============================================
-- 5. Data Connections (Google Sheets/Excel)
-- ============================================
CREATE TABLE data_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_sheets', 'excel')),
  name TEXT NOT NULL,
  credentials_encrypted TEXT,
  spreadsheet_id TEXT,
  column_mapping JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_definitions_code ON kpi_definitions(code);

CREATE INDEX idx_kpi_preferences_fund_id ON kpi_preferences(fund_id);
CREATE INDEX idx_kpi_preferences_kpi_id ON kpi_preferences(kpi_id);
CREATE INDEX idx_kpi_preferences_featured ON kpi_preferences(fund_id, is_featured) WHERE is_featured = TRUE;

CREATE INDEX idx_kpi_data_deal_id ON kpi_data(deal_id);
CREATE INDEX idx_kpi_data_kpi_id ON kpi_data(kpi_id);
CREATE INDEX idx_kpi_data_period ON kpi_data(deal_id, period_date, data_type);
CREATE INDEX idx_kpi_data_lookup ON kpi_data(deal_id, kpi_id, data_type, period_date DESC);

CREATE INDEX idx_financial_statements_deal_id ON financial_statements(deal_id);
CREATE INDEX idx_financial_statements_lookup ON financial_statements(deal_id, statement_type, period_date DESC);

CREATE INDEX idx_data_connections_fund_id ON data_connections(fund_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_kpi_preferences_updated_at 
  BEFORE UPDATE ON kpi_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_data_updated_at 
  BEFORE UPDATE ON kpi_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_statements_updated_at 
  BEFORE UPDATE ON financial_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_connections_updated_at 
  BEFORE UPDATE ON data_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_connections ENABLE ROW LEVEL SECURITY;

-- kpi_definitions: Read-only for all authenticated users
CREATE POLICY "Anyone can read KPI definitions" ON kpi_definitions
  FOR SELECT USING (true);

-- kpi_preferences: Fund-scoped
CREATE POLICY "Users can view fund preferences" ON kpi_preferences
  FOR SELECT USING (fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Managers can manage fund preferences" ON kpi_preferences
  FOR ALL USING (fund_id IN (
    SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
  ));

-- kpi_data: Via deal -> fund chain
CREATE POLICY "Users can view fund KPI data" ON kpi_data
  FOR SELECT USING (deal_id IN (
    SELECT id FROM deals WHERE fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Managers can manage KPI data" ON kpi_data
  FOR ALL USING (deal_id IN (
    SELECT id FROM deals WHERE fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  ));

-- financial_statements: Same pattern as kpi_data
CREATE POLICY "Users can view fund statements" ON financial_statements
  FOR SELECT USING (deal_id IN (
    SELECT id FROM deals WHERE fund_id IN (SELECT fund_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Managers can manage statements" ON financial_statements
  FOR ALL USING (deal_id IN (
    SELECT id FROM deals WHERE fund_id IN (
      SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
    )
  ));

-- data_connections: Managers only
CREATE POLICY "Managers can view connections" ON data_connections
  FOR SELECT USING (fund_id IN (
    SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
  ));

CREATE POLICY "Managers can manage connections" ON data_connections
  FOR ALL USING (fund_id IN (
    SELECT fund_id FROM users WHERE id = auth.uid() AND role = 'manager'
  ));

-- ============================================
-- Seed KPI Definitions for Real Estate
-- ============================================

-- Rent/Revenue KPIs
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('gpr', 'Gross Potential Rent', 'rent_revenue', 'Total rent if all units were leased at market rates', 'currency', 1),
  ('egi', 'Effective Gross Income', 'rent_revenue', 'Gross potential rent minus vacancy and concessions, plus other income', 'currency', 2),
  ('total_revenue', 'Total Revenue', 'rent_revenue', 'All income from the property', 'currency', 3),
  ('revenue_per_unit', 'Revenue Per Unit', 'rent_revenue', 'Average monthly revenue per unit', 'currency', 4),
  ('revenue_per_sqft', 'Revenue Per Sq Ft', 'rent_revenue', 'Revenue per square foot', 'currency', 5),
  ('rent_growth', 'Rent Growth', 'rent_revenue', 'Year-over-year rent increase percentage', 'percentage', 6),
  ('loss_to_lease', 'Loss to Lease', 'rent_revenue', 'Difference between market rent and actual rent', 'currency', 7),
  ('concessions', 'Concessions', 'rent_revenue', 'Total concessions and discounts given', 'currency', 8);

-- Occupancy KPIs
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('physical_occupancy', 'Physical Occupancy Rate', 'occupancy', 'Percentage of units that are physically occupied', 'percentage', 1),
  ('economic_occupancy', 'Economic Occupancy Rate', 'occupancy', 'Actual rent collected as percentage of potential rent', 'percentage', 2),
  ('vacancy_rate', 'Vacancy Rate', 'occupancy', 'Percentage of units that are vacant', 'percentage', 3),
  ('lease_renewal_rate', 'Lease Renewal Rate', 'occupancy', 'Percentage of tenants who renew their lease', 'percentage', 4),
  ('avg_days_vacant', 'Average Days Vacant', 'occupancy', 'Average number of days a unit stays vacant', 'number', 5),
  ('move_ins', 'Move-Ins', 'occupancy', 'Number of new move-ins in the period', 'number', 6),
  ('move_outs', 'Move-Outs', 'occupancy', 'Number of move-outs in the period', 'number', 7);

-- Property Performance KPIs
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('noi', 'Net Operating Income', 'property_performance', 'Revenue minus operating expenses (before debt service)', 'currency', 1),
  ('noi_margin', 'NOI Margin', 'property_performance', 'NOI as a percentage of total revenue', 'percentage', 2),
  ('operating_expense_ratio', 'Operating Expense Ratio', 'property_performance', 'Operating expenses as percentage of revenue', 'percentage', 3),
  ('cap_rate', 'Cap Rate', 'property_performance', 'NOI divided by property value', 'percentage', 4),
  ('cash_on_cash', 'Cash on Cash Return', 'property_performance', 'Annual cash flow divided by total cash invested', 'percentage', 5),
  ('total_expenses', 'Total Operating Expenses', 'property_performance', 'All operating expenses for the period', 'currency', 6),
  ('expense_per_unit', 'Expense Per Unit', 'property_performance', 'Average operating expense per unit', 'currency', 7);

-- Financial KPIs
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('ebitda', 'EBITDA', 'financial', 'Earnings before interest, taxes, depreciation, and amortization', 'currency', 1),
  ('free_cash_flow', 'Free Cash Flow', 'financial', 'Cash available after all expenses and capital expenditures', 'currency', 2),
  ('roi', 'Return on Investment', 'financial', 'Total return as percentage of investment', 'percentage', 3),
  ('irr', 'Internal Rate of Return', 'financial', 'Annualized rate of return on investment', 'percentage', 4),
  ('equity_multiple', 'Equity Multiple', 'financial', 'Total distributions divided by total equity invested', 'ratio', 5),
  ('property_value', 'Current Property Value', 'financial', 'Estimated current market value', 'currency', 6),
  ('appreciation', 'Appreciation', 'financial', 'Change in property value from acquisition', 'percentage', 7);

-- Debt Service KPIs
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('dscr', 'Debt Service Coverage Ratio', 'debt_service', 'NOI divided by annual debt service', 'ratio', 1),
  ('ltv', 'Loan-to-Value', 'debt_service', 'Loan balance as percentage of property value', 'percentage', 2),
  ('interest_coverage', 'Interest Coverage Ratio', 'debt_service', 'EBITDA divided by interest expense', 'ratio', 3),
  ('principal_balance', 'Principal Balance', 'debt_service', 'Outstanding loan principal', 'currency', 4),
  ('monthly_debt_service', 'Monthly Debt Service', 'debt_service', 'Monthly principal and interest payment', 'currency', 5),
  ('annual_debt_service', 'Annual Debt Service', 'debt_service', 'Total annual debt payments', 'currency', 6),
  ('interest_rate', 'Interest Rate', 'debt_service', 'Current loan interest rate', 'percentage', 7);

