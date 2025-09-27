-- Add missing columns to existing tables for enhanced service functionality

-- Add icon_name column to shop_service_categories if it doesn't exist
ALTER TABLE shop_service_categories
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'detailing';

-- Add image_url column to shop_service_categories if it doesn't exist
ALTER TABLE shop_service_categories
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add vehicle_size_variations column to services if it doesn't exist
ALTER TABLE services
ADD COLUMN IF NOT EXISTS vehicle_size_variations JSONB DEFAULT '{}';

-- Add image_urls column to services if it doesn't exist (as array)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add specific_addons column to services if it doesn't exist
ALTER TABLE services
ADD COLUMN IF NOT EXISTS specific_addons JSONB DEFAULT '[]';

-- Create addons table if it doesn't exist
CREATE TABLE IF NOT EXISTS addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_addons table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_id, addon_id)
);

-- Add comments to document the new columns
COMMENT ON COLUMN shop_service_categories.icon_name IS 'Icon name for the service category (e.g., detailing, cleaning, etc.)';
COMMENT ON COLUMN shop_service_categories.image_url IS 'URL of the category image';
COMMENT ON COLUMN services.vehicle_size_variations IS 'Price and duration variations by vehicle size in JSONB format';
COMMENT ON COLUMN services.image_urls IS 'Array of service image URLs (max 4)';

-- Enable RLS on new tables
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addons ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for addons table
CREATE POLICY "Users can view addons for their shops" ON addons
    FOR SELECT USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert addons for their shops" ON addons
    FOR INSERT WITH CHECK (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update addons for their shops" ON addons
    FOR UPDATE USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete addons for their shops" ON addons
    FOR DELETE USING (
        shop_id IN (
            SELECT id FROM shops WHERE owner_id = auth.uid()
        )
    );

-- Create RLS policies for service_addons table
CREATE POLICY "Users can view service_addons for their shops" ON service_addons
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE shop_id IN (
                SELECT id FROM shops WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert service_addons for their shops" ON service_addons
    FOR INSERT WITH CHECK (
        service_id IN (
            SELECT id FROM services WHERE shop_id IN (
                SELECT id FROM shops WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update service_addons for their shops" ON service_addons
    FOR UPDATE USING (
        service_id IN (
            SELECT id FROM services WHERE shop_id IN (
                SELECT id FROM shops WHERE owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete service_addons for their shops" ON service_addons
    FOR DELETE USING (
        service_id IN (
            SELECT id FROM services WHERE shop_id IN (
                SELECT id FROM shops WHERE owner_id = auth.uid()
            )
        )
    );
