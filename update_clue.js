const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2].trim();
});

const supabase = createClient(
  envVars['NEXT_PUBLIC_SUPABASE_URL'],
  envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function main() {
  const { data, error } = await supabase
    .from('tasks')
    .update({ description: 'Scan 1. Black Shirt Guy, 2. Fire Extinguisher' })
    .eq('task_number', 4);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully updated Object Scanner description in DB');
  }
}

main();
