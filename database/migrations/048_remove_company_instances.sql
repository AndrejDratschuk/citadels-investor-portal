-- ============================================
-- Migration: 048_remove_company_instances.sql
-- Description: Remove unused company_instances table that has RLS recursion bug
-- This table was created outside of migrations and is not used by the application
-- ============================================

-- Drop all policies on company_instances first (to avoid dependency issues)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'company_instances'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON company_instances', policy_record.policyname);
    END LOOP;
END $$;

-- Disable RLS before dropping (in case there are issues)
ALTER TABLE IF EXISTS company_instances DISABLE ROW LEVEL SECURITY;

-- Drop the table if it exists
DROP TABLE IF EXISTS company_instances CASCADE;

-- Also clean up any related tables that might exist
DROP TABLE IF EXISTS company_metrics CASCADE;
DROP TABLE IF EXISTS company_documents CASCADE;
DROP TABLE IF EXISTS company_team_members CASCADE;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully removed company_instances and related tables';
END $$;
