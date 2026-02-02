-- ============================================
-- Migration: 047_additional_kpis.sql
-- Description: Add additional KPIs for fund-level and deal-level metrics
-- ============================================

-- ============================================
-- 1. Fund Overview KPIs (New Category)
-- ============================================
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  ('fund_vintage', 'Fund Vintage', 'fund_overview', 'Year the fund was established', 'number', 1),
  ('committed_capital', 'Committed Capital', 'fund_overview', 'Total capital committed to the fund', 'currency', 2),
  ('capital_called', 'Capital Called', 'fund_overview', 'Total capital called from investors to date', 'currency', 3),
  ('remaining_commitment', 'Remaining Commitment', 'fund_overview', 'Uncalled capital remaining', 'currency', 4),
  ('total_properties', 'Total Properties', 'fund_overview', 'Number of properties in the portfolio', 'number', 5),
  ('gross_asset_value', 'Gross Asset Value (GAV)', 'fund_overview', 'Total value of all assets before debt', 'currency', 6),
  ('net_asset_value', 'Net Asset Value (NAV)', 'fund_overview', 'Total value minus all liabilities', 'currency', 7),
  ('total_debt_outstanding', 'Total Debt Outstanding', 'fund_overview', 'Sum of all debt across portfolio', 'currency', 8),
  ('gross_irr', 'Gross IRR', 'fund_overview', 'Internal rate of return before fees', 'percentage', 9),
  ('net_irr', 'Net IRR', 'fund_overview', 'Internal rate of return after fees', 'percentage', 10),
  ('gross_equity_multiple', 'Gross Equity Multiple', 'fund_overview', 'Gross multiple on invested capital', 'ratio', 11),
  ('net_equity_multiple', 'Net Equity Multiple', 'fund_overview', 'Net multiple on invested capital', 'ratio', 12),
  ('dpi', 'DPI (Distributions to Paid-In)', 'fund_overview', 'Cumulative distributions divided by paid-in capital', 'ratio', 13),
  ('rvpi', 'RVPI (Residual Value to Paid-In)', 'fund_overview', 'Residual value divided by paid-in capital', 'ratio', 14),
  ('tvpi', 'TVPI (Total Value to Paid-In)', 'fund_overview', 'Total value (distributions + residual) divided by paid-in capital', 'ratio', 15)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. Additional Property/Deal KPIs
-- ============================================
INSERT INTO kpi_definitions (code, name, category, description, format, sort_order) VALUES
  -- Acquisition metrics
  ('acquisition_price', 'Acquisition Price', 'property_performance', 'Original purchase price of the property', 'currency', 10),
  ('acquisition_date', 'Acquisition Date', 'property_performance', 'Date the property was acquired', 'date', 11),
  ('cap_rate_at_acquisition', 'Cap Rate at Acquisition', 'property_performance', 'Capitalization rate when property was purchased', 'percentage', 12),
  ('noi_yield_on_cost', 'NOI Yield on Cost', 'property_performance', 'In-place NOI divided by total cost basis', 'percentage', 13),
  
  -- Value metrics
  ('current_gav', 'Current GAV', 'financial', 'Current gross asset value of the property', 'currency', 10),
  ('total_equity_invested', 'Total Equity Invested', 'financial', 'Total equity capital invested in the property', 'currency', 11),
  
  -- Size metrics
  ('gross_square_footage', 'Gross Square Footage', 'property_performance', 'Total rentable square footage', 'number', 14),
  ('total_units', 'Total Units', 'property_performance', 'Number of units (for multifamily)', 'number', 15),
  ('total_beds', 'Total Beds', 'property_performance', 'Number of beds (for senior housing)', 'number', 16),
  
  -- NOI metrics
  ('in_place_noi', 'In-Place NOI', 'property_performance', 'Annualized net operating income based on current leases', 'currency', 17),
  ('annualized_noi', 'Annualized NOI', 'property_performance', 'Projected annual net operating income', 'currency', 18),
  
  -- Additional occupancy metrics
  ('occupancy_rate', 'Occupancy Rate', 'occupancy', 'Current occupancy percentage', 'percentage', 10),
  
  -- Market info
  ('market_msa', 'Market/MSA', 'property_performance', 'Metropolitan Statistical Area', 'text', 20),
  ('property_type_detail', 'Property Type', 'property_performance', 'Detailed property classification', 'text', 21)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. Add text format type if not exists
-- ============================================
-- Note: The format column should already support 'text' but this ensures it
ALTER TABLE kpi_definitions 
  DROP CONSTRAINT IF EXISTS kpi_definitions_format_check;

ALTER TABLE kpi_definitions 
  ADD CONSTRAINT kpi_definitions_format_check 
  CHECK (format IN ('currency', 'percentage', 'number', 'ratio', 'date', 'text'));

-- ============================================
-- 4. Comments for documentation
-- ============================================
COMMENT ON COLUMN kpi_definitions.format IS 'Display format: currency, percentage, number, ratio, date, or text';
