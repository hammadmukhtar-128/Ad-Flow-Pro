require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('❌ Check users failed:', error.message);
  } else {
    console.log('✅ Users found:', data.length);
    data.forEach(u => {
      console.log(`User: ${u.email} | Role: ${u.role}`);
    });
  }
}

checkUsers();
