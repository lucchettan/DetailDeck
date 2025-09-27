-- Migration: Auto-create empty shop on user signup
-- This ensures every new user gets a shop automatically, triggering onboarding

-- Function to create an empty shop for new users
CREATE OR REPLACE FUNCTION create_empty_shop_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create an empty shop for the new user
  INSERT INTO public.shops (
    email,
    name,
    business_type,
    opening_hours,
    booking_rules
  ) VALUES (
    NEW.email,
    'Mon Entreprise', -- Default name
    'local', -- Default business type
    '{
      "monday": [{"start": "09:00", "end": "17:00"}],
      "tuesday": [{"start": "09:00", "end": "17:00"}],
      "wednesday": [{"start": "09:00", "end": "17:00"}],
      "thursday": [{"start": "09:00", "end": "17:00"}],
      "friday": [{"start": "09:00", "end": "17:00"}],
      "saturday": [],
      "sunday": []
    }', -- Default opening hours (9am-5pm Mon-Fri)
    '{"min_notice_hours": 2, "advance_weeks": 4, "slot_duration_minutes": 30}' -- Default booking rules
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that executes after user signup
CREATE OR REPLACE TRIGGER create_shop_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_empty_shop_for_new_user();

-- Create empty shops for existing users who don't have one
INSERT INTO shops (email, name, business_type, opening_hours, booking_rules)
SELECT 
  u.email,
  'Mon Entreprise',
  'local',
  '{
    "monday": [{"start": "09:00", "end": "17:00"}],
    "tuesday": [{"start": "09:00", "end": "17:00"}],
    "wednesday": [{"start": "09:00", "end": "17:00"}],
    "thursday": [{"start": "09:00", "end": "17:00"}],
    "friday": [{"start": "09:00", "end": "17:00"}],
    "saturday": [],
    "sunday": []
  }',
  '{"min_notice_hours": 2, "advance_weeks": 4, "slot_duration_minutes": 30}'
FROM auth.users u
LEFT JOIN shops s ON u.email = s.email
WHERE s.email IS NULL
  AND u.email IS NOT NULL;
