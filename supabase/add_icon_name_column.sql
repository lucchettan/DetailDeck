-- Add icon_name column to shop_service_categories table
-- This column will store the icon name for service categories

ALTER TABLE shop_service_categories
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'detailing';

-- Add a comment to document the column
COMMENT ON COLUMN shop_service_categories.icon_name IS 'Icon name for the service category (e.g., detailing, cleaning, etc.)';



