-- Create add_ons table if it doesn't exist
CREATE TABLE IF NOT EXISTS add_ons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    service_id uuid REFERENCES services(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price integer NOT NULL DEFAULT 0,
    duration integer NOT NULL DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_add_ons_service_id ON add_ons(service_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_shop_id ON add_ons(shop_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_active ON add_ons(is_active);

-- Add comment to document the table
COMMENT ON TABLE add_ons IS 'Add-ons specific to services or shops';
