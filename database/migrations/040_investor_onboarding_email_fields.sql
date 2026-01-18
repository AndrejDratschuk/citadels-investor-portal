-- Migration: 040_investor_onboarding_email_fields
-- Description: Add fields for Stage 02 Investor Onboarding email flows
-- Date: 2026-01-18

-- Add document review timeframe and welcome message fields to funds table
ALTER TABLE funds
ADD COLUMN IF NOT EXISTS document_review_timeframe TEXT DEFAULT '1-2 business days',
ADD COLUMN IF NOT EXISTS welcome_message TEXT;

-- Add comments for documentation
COMMENT ON COLUMN funds.document_review_timeframe IS 'Expected timeframe for document review, displayed in document uploaded pending email';
COMMENT ON COLUMN funds.welcome_message IS 'Custom welcome message included in the welcome investor email';

-- Add investor onboarding tracking fields to investors table
ALTER TABLE investors
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_sent_for_signature_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_fully_executed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funding_instructions_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funding_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funding_amount_received DECIMAL(15,2);

-- Add comments for investor tracking fields
COMMENT ON COLUMN investors.profile_completed_at IS 'Timestamp when investor completed their profile';
COMMENT ON COLUMN investors.documents_approved_at IS 'Timestamp when all investor documents were approved';
COMMENT ON COLUMN investors.documents_sent_for_signature_at IS 'Timestamp when documents were sent for DocuSign signature';
COMMENT ON COLUMN investors.documents_signed_at IS 'Timestamp when investor signed documents';
COMMENT ON COLUMN investors.documents_fully_executed_at IS 'Timestamp when manager countersigned and documents fully executed';
COMMENT ON COLUMN investors.funding_instructions_sent_at IS 'Timestamp when funding/wire instructions were sent';
COMMENT ON COLUMN investors.funding_received_at IS 'Timestamp when funding was received';
COMMENT ON COLUMN investors.funding_amount_received IS 'Amount received via wire transfer';
