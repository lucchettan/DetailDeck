import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uzvjmkprsjjpzgprzgse.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dmpta3Byc2pqcHpncHJ6Z3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MzM1MDAsImV4cCI6MjA3MzQwOTUwMH0.8zDjPJ1tgVnMzjY0KGCpD9lYMDrF-xQjwJFjKAhxKRc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking services for shop 3f3dc492-abbd-4be9-a7b1-2883e17119a9...');

// Check all services
const { data: allServices, error: allError } = await supabase
  .from('services')
  .select('id, name, is_active, shop_id')
  .eq('shop_id', '3f3dc492-abbd-4be9-a7b1-2883e17119a9');

if (allError) {
  console.error('❌ Error fetching all services:', allError);
  process.exit(1);
}

console.log('📋 All services:', allServices);

// Check only active services
const { data: activeServices, error: activeError } = await supabase
  .from('services')
  .select('id, name, is_active, shop_id')
  .eq('shop_id', '3f3dc492-abbd-4be9-a7b1-2883e17119a9')
  .eq('is_active', true);

if (activeError) {
  console.error('❌ Error fetching active services:', activeError);
  process.exit(1);
}

console.log('✅ Active services:', activeServices);

// Check categories too
const { data: categories, error: catError } = await supabase
  .from('shop_service_categories')
  .select('id, name, is_active, shop_id')
  .eq('shop_id', '3f3dc492-abbd-4be9-a7b1-2883e17119a9');

if (catError) {
  console.error('❌ Error fetching categories:', catError);
  process.exit(1);
}

console.log('📂 Categories:', categories);
