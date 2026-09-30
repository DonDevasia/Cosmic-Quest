import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const SUPABASE_SERVICE_ROLE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateHints() {
  const hints = {
    1: 'I go forward, I go back, yet never leave my place',
    3: '         (0, 1)\n\n\n(-1, 0)     ?     (1, 0)\n\n            \n           (0, -1)',
    4: 'carbon,helium,',
    5: 'Oru tulli , pallatulli ,peru vellam',
    6: "Machines have their secrets, but don't look for them on the floor. Search where every step takes you closer",
    8: 'Follow the path to where many stay; before you arrive, find where the wheels choose to stay'
  };

  for (const [taskId, hint] of Object.entries(hints)) {
    const { error } = await supabase.from('tasks').update({ venue_hint: hint }).eq('task_number', parseInt(taskId));
    if (error) console.error(`Error updating task ${taskId}:`, error);
  }
  console.log('Venue hints updated successfully!');
}

updateHints();
