require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function describeTable() {
  // We can't do DESCRIBE in supabase-js easily, but we can try to select one row
  const { data, error } = await supabase.from('ads').select('*').limit(1);
  if (error) {
    console.error('❌ Table select failed:', error.message);
  } else {
    console.log('✅ Columns found:', data.length > 0 ? Object.keys(data[0]) : 'No data in table to infer columns');
  }
}

describeTable();
