import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const newTasks = [
    {
      task_number: 11,
      title: "Phase 2 - QR 1",
      description: "Find the QR code at Location 1",
      base_points: 200,
      time_limit_seconds: 600,
      status: "Locked",
      completion_keyword: "LOC1_CODE",
      venue_hint: "Find the hidden QR in the specified location 1."
    },
    {
      task_number: 12,
      title: "Phase 2 - QR 2",
      description: "Find the QR code at Location 2",
      base_points: 200,
      time_limit_seconds: 600,
      status: "Locked",
      completion_keyword: "LOC2_CODE",
      venue_hint: "Find the hidden QR in the specified location 2."
    },
    {
      task_number: 13,
      title: "Phase 2 - QR 3",
      description: "Find the QR code at Location 3",
      base_points: 200,
      time_limit_seconds: 600,
      status: "Locked",
      completion_keyword: "LOC3_CODE",
      venue_hint: "Find the hidden QR in the specified location 3."
    },
    {
      task_number: 14,
      title: "Phase 2 - Final Destination",
      description: "Reach the final location to claim victory",
      base_points: 500,
      time_limit_seconds: 1200,
      status: "Locked",
      completion_keyword: "VICTORY",
      venue_hint: "Run to the final destination!"
    }
  ];

  const { data, error } = await supabase.from('tasks').insert(newTasks);
  if (error) {
    console.error('Error inserting tasks:', error);
  } else {
    console.log('Successfully inserted Phase 2 tasks.');
  }
}

main();
