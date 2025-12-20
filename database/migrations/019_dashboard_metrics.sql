-- Migration: Add debt_amount to deals for dashboard metrics
-- Only field not already in schema

ALTER TABLE deals ADD COLUMN IF NOT EXISTS debt_amount DECIMAL(15,2) DEFAULT 0;

COMMENT ON COLUMN deals.debt_amount IS 'Outstanding debt on this deal for Debt Outstanding KPI';

