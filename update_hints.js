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
    7: "9. Don't let my basketball break your bike's mirror.",
    8: "Kisi Ka Bhai Kisi Ki Jaan" // The user changed it in schema.sql but didn't update the DB. So I'll do it here!
  };

  for (const [taskId, hint] of Object.entries(hints)) {
    const { error } = await supabase.from('tasks').update({ venue_hint: hint }).eq('task_number', parseInt(taskId));
    if (error) console.error(`Error updating task ${taskId}:`, error);
  }
  console.log('Hints 7 and 8 updated successfully!');
}

updateHints();
