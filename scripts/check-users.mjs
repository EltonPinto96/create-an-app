import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://csgxlruqvzxvijrkvvxi.supabase.co',
  'sb_publishable_UWR-nlDDnwaEQxyS7a8xhQ_mKdkWXa9'
);

const { data: users, error } = await supabase.from('profiles').select('*');
console.log('Profiles:', users, error);

const { data: admins, error: adminErr } = await supabase.from('admin_roles').select('*');
console.log('Admins:', admins, adminErr);
