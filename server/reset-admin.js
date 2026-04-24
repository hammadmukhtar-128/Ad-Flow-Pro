require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const email = 'hammadmukhtar128@gmail.com';
const newPassword = 'Hammad@146';

async function resetPassword() {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword, full_name: 'Super Admin' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Failed to reset password:', error.message);
  } else {
    console.log('✅ Password reset successfully for:', email);
    console.log('Updated user:', data);
  }
}

resetPassword();
