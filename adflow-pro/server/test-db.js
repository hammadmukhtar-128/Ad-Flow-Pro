require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Connection successful. User count test passed.');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

test();
