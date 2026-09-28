const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://skevmflpxyabddaalkvh.supabase.co';
const supabaseKey = 'sb_publishable_jWsmOXu53XcfnaWhYU2kSg_MfeVsBm8'; // Wait, I need service_role key to alter table, or I can just use raw SQL from the dashboard.
// But Supabase JS client doesn't support ALTER TABLE.
// I can just tell the user to run it in the SQL Editor.
