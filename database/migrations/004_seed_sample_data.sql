-- =============================================
-- SEED DATA FOR TESTING INVESTOR DASHBOARD
-- =============================================
-- Run this in Supabase SQL Editor after signing up a user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

-- Step 1: Create a sample fund
INSERT INTO funds (id, name, legal_name, target_raise, total_committed, status, address)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'FlowVeda Growth Fund I',
  'FlowVeda Growth Fund I, LP',
  50000000.00,
  32500000.00,
  'active',
  '{"street": "123 Investment Blvd", "city": "Austin", "state": "TX", "zip": "78701", "country": "USA"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update the user's fund_id (replace YOUR_USER_ID_HERE)
-- First, find your user ID by running: SELECT id, email FROM auth.users;
-- UPDATE users SET fund_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE id = 'YOUR_USER_ID_HERE';

-- Step 3: Create an investor record for the user (replace YOUR_USER_ID_HERE and use your email)
-- INSERT INTO investors (id, user_id, fund_id, first_name, last_name, email, commitment_amount, total_called, total_invested, accreditation_status, status)
-- VALUES (
--   'b2c3d4e5-f6a7-8901-bcde-f23456789012',
--   'YOUR_USER_ID_HERE',
--   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
--   'John',
--   'Investor',
--   'your-email@example.com',
--   250000.00,
--   175000.00,
--   175000.00,
--   'approved',
--   'active'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Create sample deals
INSERT INTO deals (id, fund_id, name, description, status, address, property_type, unit_count, square_footage, acquisition_price, acquisition_date, current_value, total_investment, kpis)
VALUES 
  (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Riverside Apartments',
    'A 120-unit Class B multifamily property in a rapidly growing submarket with strong rent growth potential.',
    'stabilized',
    '{"street": "456 Riverside Dr", "city": "Austin", "state": "TX", "zip": "78702"}'::jsonb,
    'multifamily',
    120,
    95000,
    12500000.00,
    '2023-06-15',
    14200000.00,
    13800000.00,
    '{"noi": 985000, "capRate": 0.0693, "cashOnCash": 0.082, "occupancyRate": 0.94}'::jsonb
  ),
  (
    'd4e5f6a7-b8c9-0123-def0-456789012345',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Downtown Office Tower',
    'Class A office building in prime downtown location with long-term corporate tenants.',
    'acquired',
    '{"street": "789 Congress Ave", "city": "Austin", "state": "TX", "zip": "78701"}'::jsonb,
    'office',
    NULL,
    185000,
    28000000.00,
    '2024-01-20',
    28500000.00,
    29200000.00,
    '{"noi": 2100000, "capRate": 0.0718, "cashOnCash": 0.065, "occupancyRate": 0.88}'::jsonb
  ),
  (
    'e5f6a7b8-c9d0-1234-ef01-567890123456',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Eastside Industrial Park',
    'Modern industrial/logistics facility with excellent highway access and strong tenant demand.',
    'renovating',
    '{"street": "2100 Industrial Way", "city": "Pflugerville", "state": "TX", "zip": "78660"}'::jsonb,
    'industrial',
    NULL,
    250000,
    18500000.00,
    '2024-03-01',
    18500000.00,
    20100000.00,
    '{"noi": 1250000, "capRate": 0.0622, "occupancyRate": 0.72, "renovationBudget": 3500000, "renovationSpent": 1200000}'::jsonb
  ),
  (
    'f6a7b8c9-d0e1-2345-f012-678901234567',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Lakefront Retail Center',
    'Neighborhood retail center anchored by grocery store with stable cash flow.',
    'stabilized',
    '{"street": "500 Lakefront Blvd", "city": "Cedar Park", "state": "TX", "zip": "78613"}'::jsonb,
    'retail',
    NULL,
    65000,
    9800000.00,
    '2023-09-10',
    10500000.00,
    10200000.00,
    '{"noi": 780000, "capRate": 0.0743, "cashOnCash": 0.091, "occupancyRate": 0.97}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Step 5: Link investor to deals (run after creating investor)
-- Replace 'YOUR_INVESTOR_ID' with the investor ID from step 3
-- INSERT INTO investor_deals (investor_id, deal_id, ownership_percentage, joined_at)
-- VALUES 
--   ('YOUR_INVESTOR_ID', 'c3d4e5f6-a7b8-9012-cdef-345678901234', 0.0192, '2023-06-15'),
--   ('YOUR_INVESTOR_ID', 'd4e5f6a7-b8c9-0123-def0-456789012345', 0.0086, '2024-01-20'),
--   ('YOUR_INVESTOR_ID', 'e5f6a7b8-c9d0-1234-ef01-567890123456', 0.0124, '2024-03-01'),
--   ('YOUR_INVESTOR_ID', 'f6a7b8c9-d0e1-2345-f012-678901234567', 0.0255, '2023-09-10')
-- ON CONFLICT (investor_id, deal_id) DO NOTHING;

-- Step 6: Create sample documents for the investor
-- INSERT INTO documents (id, fund_id, investor_id, type, name, requires_signature, signing_status, created_at)
-- VALUES
--   (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'YOUR_INVESTOR_ID', 'ppm', 'Private Placement Memorandum', true, 'signed', NOW() - INTERVAL '60 days'),
--   (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'YOUR_INVESTOR_ID', 'subscription', 'Subscription Agreement', true, 'signed', NOW() - INTERVAL '55 days'),
--   (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'YOUR_INVESTOR_ID', 'k1', 'K-1 Tax Document 2023', false, NULL, NOW() - INTERVAL '30 days'),
--   (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'YOUR_INVESTOR_ID', 'report', 'Q3 2024 Quarterly Report', false, NULL, NOW() - INTERVAL '15 days'),
--   (uuid_generate_v4(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'YOUR_INVESTOR_ID', 'report', 'Q4 2024 Quarterly Report', false, NULL, NOW() - INTERVAL '5 days')
-- ON CONFLICT (id) DO NOTHING;


-- =============================================
-- HELPER SCRIPT: Run this to get your user ID
-- =============================================
-- SELECT id, email FROM auth.users;

-- =============================================
-- QUICK SETUP (Replace YOUR_USER_ID and YOUR_EMAIL)
-- Copy and run this after getting your user ID:
-- =============================================
/*
-- Set these variables
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE';
  v_email TEXT := 'YOUR_EMAIL_HERE';
  v_fund_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_investor_id UUID := 'b2c3d4e5-f6a7-8901-bcde-f23456789012';
BEGIN
  -- Update user's fund_id
  UPDATE users SET fund_id = v_fund_id WHERE id = v_user_id;
  
  -- Create investor record
  INSERT INTO investors (id, user_id, fund_id, first_name, last_name, email, commitment_amount, total_called, total_invested, accreditation_status, status)
  VALUES (v_investor_id, v_user_id, v_fund_id, 'John', 'Investor', v_email, 250000.00, 175000.00, 175000.00, 'approved', 'active')
  ON CONFLICT (id) DO NOTHING;
  
  -- Link investor to deals
  INSERT INTO investor_deals (investor_id, deal_id, ownership_percentage, joined_at)
  VALUES 
    (v_investor_id, 'c3d4e5f6-a7b8-9012-cdef-345678901234', 0.0192, '2023-06-15'),
    (v_investor_id, 'd4e5f6a7-b8c9-0123-def0-456789012345', 0.0086, '2024-01-20'),
    (v_investor_id, 'e5f6a7b8-c9d0-1234-ef01-567890123456', 0.0124, '2024-03-01'),
    (v_investor_id, 'f6a7b8c9-d0e1-2345-f012-678901234567', 0.0255, '2023-09-10')
  ON CONFLICT (investor_id, deal_id) DO NOTHING;
  
  -- Create sample documents
  INSERT INTO documents (fund_id, investor_id, type, name, requires_signature, signing_status, created_at)
  VALUES
    (v_fund_id, v_investor_id, 'ppm', 'Private Placement Memorandum', true, 'signed', NOW() - INTERVAL '60 days'),
    (v_fund_id, v_investor_id, 'subscription', 'Subscription Agreement', true, 'signed', NOW() - INTERVAL '55 days'),
    (v_fund_id, v_investor_id, 'k1', 'K-1 Tax Document 2023', false, NULL, NOW() - INTERVAL '30 days'),
    (v_fund_id, v_investor_id, 'report', 'Q3 2024 Quarterly Report', false, NULL, NOW() - INTERVAL '15 days'),
    (v_fund_id, v_investor_id, 'report', 'Q4 2024 Quarterly Report', false, NULL, NOW() - INTERVAL '5 days');
END $$;
*/


