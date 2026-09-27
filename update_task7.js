import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: 'Dictionary Game',
      description: 'Identify the correct term from the dictionary definition',
      completion_keyword: 'DAEMON'
    })
    .eq('task_number', 7);

  if (error) {
    console.error('Error updating task:', error);
  } else {
    console.log('Successfully updated task 7 to Dictionary Game.');
  }
}

main();
