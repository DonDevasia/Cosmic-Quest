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
    2: 'To meet the master , Two steps, zero excuses, nine chances…\nSounds like a strange combination, right? 👀',
    9: 'There existed Three little pigs, each one called E,\nWhen it was a hot day, they wanted to rest under a TREE.'
  };

  for (const [taskId, hint] of Object.entries(hints)) {
    const { error } = await supabase.from('tasks').update({ venue_hint: hint }).eq('task_number', parseInt(taskId));
    if (error) console.error(`Error updating task ${taskId}:`, error);
  }
  console.log('Hints 2 and 9 updated successfully!');
}

updateHints();
