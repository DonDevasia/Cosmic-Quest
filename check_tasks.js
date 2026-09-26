const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://skevmflpxyabddaalkvh.supabase.co',
  'sb_publishable_jWsmOXu53XcfnaWhYU2kSg_MfeVsBm8'
);

async function checkTasks() {
  const { data, error } = await supabase.from('tasks').select('id, task_number, title, completion_keyword');
  if (error) console.error(error);
  console.log(data);
}

checkTasks();
