-- Fix RLS policies for KPI-related tables
-- 
-- Migration: 050_fix_data_connections_rls.sql
-- 
-- Problem: The current RLS policies check auth.uid() which returns NULL when
-- using the service role key from the backend. This causes INSERT failures
-- when the API tries to create data connections or import KPI data.
--
-- Solution: Add policies that allow service role operations.

-- Add policy for service role operations on data_connections
CREATE POLICY "Service role can manage data_connections" ON data_connections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add service role policy for kpi_data
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "Service role can manage kpi_data" ON kpi_data
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'')';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- Add service role policy for kpi_preferences
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "Service role can manage kpi_preferences" ON kpi_preferences
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'')';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;

-- Add service role policy for financial_statements
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "Service role can manage financial_statements" ON financial_statements
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'')';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN NULL;
END $$;
