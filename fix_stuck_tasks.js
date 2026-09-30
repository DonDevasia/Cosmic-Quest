import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Extract keys from .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixStuckTasks() {
  console.log('Finding stuck completed Phase 2 tasks...');
  
  // Find all team_tasks that are active and completed
  const { data: stuckTasks, error } = await supabase
    .from('team_tasks')
    .select('team_id, task_id')
    .eq('is_active', true)
    .eq('status', 'Completed');
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${stuckTasks.length} potentially stuck tasks.`);
  
  for (const t of stuckTasks) {
    // Check if it's phase 2
    const { data: taskData } = await supabase.from('tasks').select('task_number').eq('id', t.task_id).single();
    if (taskData && taskData.task_number > 10) {
      console.log(`Fixing stuck Phase 2 task for team ${t.team_id}`);
      // Mark as inactive
      await supabase.from('team_tasks').update({ is_active: false }).eq('team_id', t.team_id).eq('task_id', t.task_id);
    }
  }
  
  console.log('Done.');
}

fixStuckTasks();
