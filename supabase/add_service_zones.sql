-- Add support for multiple service zones for mobile shops
-- This migration adds a service_zones JSON column to store multiple zones

-- Step 1: Add the new column for service zones
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS service_zones JSONB;

-- Step 2: Wait a moment for the column to be created, then update existing mobile shops
-- Only update mobile shops that don't have service_zones yet
DO $$
BEGIN
  -- Check if we need to populate service_zones for mobile shops
  IF EXISTS (
    SELECT 1 FROM shops
    WHERE business_type = 'mobile'
    AND service_zones IS NULL
  ) THEN
    UPDATE shops
    SET service_zones = jsonb_build_array(
      jsonb_build_object(
        'city', COALESCE(address_city, 'Ville par défaut'),
        'radius', '10'
      )
    )
    WHERE business_type = 'mobile'
      AND service_zones IS NULL;
  END IF;
END $$;

-- Add a constraint to ensure service_zones is valid JSON array
ALTER TABLE shops
ADD CONSTRAINT service_zones_is_array
CHECK (service_zones IS NULL OR jsonb_typeof(service_zones) = 'array');

-- Create an index for better performance when querying service zones
CREATE INDEX IF NOT EXISTS idx_shops_service_zones
ON shops USING GIN (service_zones);

-- Add comments for documentation
COMMENT ON COLUMN shops.service_zones IS 'JSON array of service zones for mobile shops, each containing city and radius';

-- Example of service_zones structure:
-- [
--   {"city": "Paris", "radius": "20"},
--   {"city": "Lyon", "radius": "15"}
-- ]
