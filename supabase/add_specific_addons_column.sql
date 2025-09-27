-- Add specific_addons column to services table
-- This column will store add-ons specific to each service in JSONB format

ALTER TABLE services
ADD COLUMN IF NOT EXISTS specific_addons JSONB DEFAULT '[]';

-- Add comment to document the new column
COMMENT ON COLUMN services.specific_addons IS 'Add-ons specific to this service in JSONB format: [{"name": "Cire", "price": 25, "duration": 0, "description": "Protection cire"}]';



