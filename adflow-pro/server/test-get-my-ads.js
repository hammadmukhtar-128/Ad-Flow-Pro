require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userId = 'd0000004-0000-0000-0000-000000000001'; // Use the same test user ID

async function testGetMyAds() {
  console.log('Testing GET MY ADS query...');
  const { data, error } = await supabase
    .from('ads')
    .select(`
      id, title, description, package_type, status, rejection_reason, created_at,
      category:categories(id, name, slug),
      city:cities(id, name, province)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('✅ Query succeeded!');
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

testGetMyAds();
