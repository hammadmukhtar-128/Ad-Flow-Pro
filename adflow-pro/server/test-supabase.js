const { supabase } = require('./db/connect');
console.log('Supabase check:');
console.log('from:', typeof supabase.from);
const query = supabase.from('ads').select('*');
console.log('select:', typeof query.select);
console.log('eq:', typeof query.eq);
console.log('lte:', typeof query.lte);
