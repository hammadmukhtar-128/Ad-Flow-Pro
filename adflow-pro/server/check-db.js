const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error: eq } = await supabase.from('users').select('*').limit(1);
  const { data: ads, error: ae } = await supabase.from('ads').select('*').limit(1);
  const { data: cats, error: ce } = await supabase.from('categories').select('*').limit(1);
  const { data: cities, error: cie } = await supabase.from('cities').select('*').limit(1);
  const { data: sp, error: se } = await supabase.from('seller_profiles').select('*').limit(1);

  console.log("Users:", eq ? eq.message : "Exists");
  console.log("Ads:", ae ? ae.message : "Exists");
  console.log("Categories:", ce ? ce.message : "Exists");
  console.log("Cities:", cie ? cie.message : "Exists");
  console.log("Seller_profiles:", se ? se.message : "Exists");
}
check();
