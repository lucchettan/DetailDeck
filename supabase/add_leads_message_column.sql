-- Migration: Add message column to leads table
-- This allows storing detailed callback request information

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS message text;

-- Add comment for documentation
COMMENT ON COLUMN leads.message IS 'Detailed message about the lead request, including services and pricing information';
