require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const testAd = {
    user_id: 'd0000004-0000-0000-0000-000000000001',
    title: 'Test Ad Insertion',
    description: 'This is a test description over ten characters long.',
    category_id: 'a0000001-0000-0000-0000-000000000001',
    city_id: 'b0000002-0000-0000-0000-000000000001',
    package_type: 'basic', // Try lowercase
    status: 'draft',
    slug: 'test-ad-insertion'
  };

  console.log('Testing with lowercase basic...');
  const { error: error1 } = await supabase.from('ads').insert(testAd);
  if (error1) console.error('❌ Lowercase basic failed:', error1.message);
  else console.log('✅ Lowercase basic worked!');

  console.log('Testing with capitalized Basic...');
  const { error: error2 } = await supabase.from('ads').insert({ ...testAd, package_type: 'Basic', slug: 'test-ad-2' });
  if (error2) console.error('❌ Capitalized Basic failed:', error2.message);
  else console.log('✅ Capitalized Basic worked!');
}

testInsert();
