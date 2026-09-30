import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const SUPABASE_SERVICE_ROLE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateKeywords() {
  const tasks = [
    { id: 1, kw: 'HAHAHA' },
    { id: 2, kw: 'THE_ARCHITECT' },
    { id: 3, kw: '12223' },
    { id: 5, kw: 'SPACE' },
    { id: 6, kw: 'ONE' },
    { id: 7, kw: '7272' },
    { id: 8, kw: 'GROUND' },
    { id: 9, kw: '42' },
    { id: 10, kw: 'SMART' },
    { id: 11, kw: 'LOC1_CODE' },
    { id: 12, kw: 'LOC2_CODE' },
    { id: 13, kw: 'LOC3_CODE' },
    { id: 14, kw: 'VICTORY' }
  ];

  for (const t of tasks) {
    const { error } = await supabase.from('tasks').update({ completion_keyword: t.kw }).eq('task_number', t.id);
    if (error) console.error(`Error updating task ${t.id}:`, error);
  }
  console.log('Keywords updated successfully based on schema.sql changes!');
}

updateKeywords();
