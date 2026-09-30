import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: team } = await supabase.from('teams').select('*').eq('team_code', 'TESTADMIN').single();
  const { data: tasks } = await supabase.from('team_tasks').select('*, tasks(title)').eq('team_id', team.id).eq('is_active', true);
  console.log(JSON.stringify(tasks, null, 2));
}

check();
