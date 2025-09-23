-- Migration for Customizable Categories and Vehicle Sizes
-- Phase 1: Create new tables for shop-specific customization

-- 1. Shop Vehicle Sizes (customizable per shop)
CREATE TABLE IF NOT EXISTS shop_vehicle_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Small", "Medium", "Large", "XL", "Motorcycle", etc.
  subtitle TEXT, -- "Coupe, Sedan", "Small SUV, Crossover", etc.
  icon_url TEXT, -- Optional custom icon
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For sorting
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per shop
  UNIQUE(shop_id, name)
);

-- 2. Shop Service Categories (customizable per shop)
CREATE TABLE IF NOT EXISTS shop_service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Interior", "Exterior", "Engine Bay", etc.
  icon_name TEXT, -- Icon identifier for UI (e.g., 'interior', 'exterior')
  icon_url TEXT, -- Optional custom icon URL
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per shop
  UNIQUE(shop_id, name)
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_vehicle_sizes_shop_id ON shop_vehicle_sizes(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_vehicle_sizes_active ON shop_vehicle_sizes(shop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shop_service_categories_shop_id ON shop_service_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_service_categories_active ON shop_service_categories(shop_id, is_active);

-- 4. Function to seed default vehicle sizes for a shop
CREATE OR REPLACE FUNCTION seed_default_vehicle_sizes(p_shop_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO shop_vehicle_sizes (shop_id, name, subtitle, display_order) VALUES
    (p_shop_id, 'Small', 'Coupe, Sedan', 1),
    (p_shop_id, 'Medium', 'Small SUV, Crossover', 2),
    (p_shop_id, 'Large', 'Large SUV, Minivan', 3),
    (p_shop_id, 'X-Large', 'Truck, Van', 4)
  ON CONFLICT (shop_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to seed default service categories for a shop
CREATE OR REPLACE FUNCTION seed_default_service_categories(p_shop_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO shop_service_categories (shop_id, name, icon_name, display_order) VALUES
    (p_shop_id, 'Interior Services', 'interior', 1),
    (p_shop_id, 'Exterior Services', 'exterior', 2)
  ON CONFLICT (shop_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to automatically seed defaults when a shop is created
CREATE OR REPLACE FUNCTION trigger_seed_shop_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Seed default vehicle sizes
  PERFORM seed_default_vehicle_sizes(NEW.id);

  -- Seed default service categories
  PERFORM seed_default_service_categories(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_seed_shop_defaults ON shops;
CREATE TRIGGER trigger_seed_shop_defaults
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_shop_defaults();

-- 7. Seed defaults for existing shops
DO $$
DECLARE
  shop_record RECORD;
BEGIN
  FOR shop_record IN SELECT id FROM shops LOOP
    PERFORM seed_default_vehicle_sizes(shop_record.id);
    PERFORM seed_default_service_categories(shop_record.id);
  END LOOP;
END $$;

-- 8. Phase 2: Add new columns to existing tables (keeping old ones for now)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES shop_service_categories(id);

ALTER TABLE service_vehicle_size_supplements
ADD COLUMN IF NOT EXISTS vehicle_size_id UUID REFERENCES shop_vehicle_sizes(id);

-- 9. Migrate existing data
-- Update services to use new category system
UPDATE services
SET category_id = (
  SELECT ssc.id
  FROM shop_service_categories ssc
  WHERE ssc.shop_id = services.shop_id
  AND (
    (services.category = 'interior' AND ssc.name = 'Interior Services') OR
    (services.category = 'exterior' AND ssc.name = 'Exterior Services') OR
    (services.category = 'complementary' AND ssc.name = 'Exterior Services') -- Default complementary to exterior
  )
  LIMIT 1
)
WHERE category_id IS NULL;

-- Update vehicle size supplements to use new system
UPDATE service_vehicle_size_supplements
SET vehicle_size_id = (
  SELECT svs.id
  FROM shop_vehicle_sizes svs
  JOIN services s ON s.shop_id = svs.shop_id
  WHERE s.id = service_vehicle_size_supplements.service_id
  AND (
    (service_vehicle_size_supplements.size = 'S' AND svs.name = 'Small') OR
    (service_vehicle_size_supplements.size = 'M' AND svs.name = 'Medium') OR
    (service_vehicle_size_supplements.size = 'L' AND svs.name = 'Large') OR
    (service_vehicle_size_supplements.size = 'XL' AND svs.name = 'X-Large')
  )
  LIMIT 1
)
WHERE vehicle_size_id IS NULL;

-- 10. Create views for backwards compatibility during transition
CREATE OR REPLACE VIEW services_with_category AS
SELECT
  s.*,
  ssc.name as category_name,
  ssc.icon_name as category_icon
FROM services s
LEFT JOIN shop_service_categories ssc ON s.category_id = ssc.id;

CREATE OR REPLACE VIEW supplements_with_size AS
SELECT
  svss.*,
  svs.name as size_name,
  svs.subtitle as size_subtitle
FROM service_vehicle_size_supplements svss
LEFT JOIN shop_vehicle_sizes svs ON svss.vehicle_size_id = svs.id;

-- 11. RLS Policies for new tables
ALTER TABLE shop_vehicle_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_service_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own shop's data
CREATE POLICY "Users can manage their shop's vehicle sizes" ON shop_vehicle_sizes
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their shop's service categories" ON shop_service_categories
  FOR ALL USING (
    shop_id IN (
      SELECT id FROM shops WHERE owner_id = auth.uid()
    )
  );

-- Policy: Public can read active categories and sizes for booking
CREATE POLICY "Public can read active vehicle sizes" ON shop_vehicle_sizes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active service categories" ON shop_service_categories
  FOR SELECT USING (is_active = true);
