const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://skevmflpxyabddaalkvh.supabase.co',
  'sb_publishable_jWsmOXu53XcfnaWhYU2kSg_MfeVsBm8'
);

async function updateDb() {
  const { error: err1 } = await supabase
    .from('tasks')
    .update({ base_points: 100 })
    .eq('task_number', 9);
  
  if (err1) console.error(err1);
  else console.log('Successfully updated task 9 points to 100');

  const { error: err2 } = await supabase
    .from('tasks')
    .update({ base_points: 100 })
    .eq('task_number', 10);

  if (err2) console.error(err2);
  else console.log('Successfully updated task 10 points to 100');
}

updateDb();
