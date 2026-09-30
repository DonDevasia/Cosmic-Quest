import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { taskNumber } = await request.json();

    // 0. Find the actual Task UUID
    const { data: realTask, error: taskErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('task_number', taskNumber)
      .single();
      
    if (taskErr || !realTask) {
      throw new Error("Task not found in database");
    }
    
    const taskId = realTask.id;

    // 1. Find or create a Test Team
    let { data: testTeam, error: teamErr } = await supabase
      .from('teams')
      .select('id, team_code')
      .eq('team_code', 'TESTADMIN')
      .maybeSingle();

    if (!testTeam) {
      const { data: newTeam, error: createErr } = await supabase
        .from('teams')
        .insert([{
          team_name: 'Admin Test Team',
          team_code: 'TESTADMIN',
          team_number: 999,
          member_a: 'Admin',
          total_score: 0
        }])
        .select('id, team_code')
        .single();
        
      if (createErr) throw createErr;
      testTeam = newTeam;
    }

    // 2. Clear existing active tasks for Test Team
    await supabase
      .from('team_tasks')
      .update({ is_active: false })
      .eq('team_id', testTeam.id);

    // 3. Delete the specific task from history if they already did it, so it feels fresh
    await supabase
      .from('team_tasks')
      .delete()
      .eq('team_id', testTeam.id)
      .eq('task_id', taskId);

    // 4. Assign the requested task
    const { error: assignErr } = await supabase
      .from('team_tasks')
      .insert([{
        team_id: testTeam.id,
        task_id: taskId,
        is_active: true,
        status: 'Assigned'
      }]);

    if (assignErr) throw assignErr;
    
    // Ensure game is running so the team page doesn't show "Waiting for launch"
    await supabase.from('event_state').update({ is_active: true, timer_running: true }).neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({ success: true, teamCode: testTeam.team_code });
  } catch (error) {
    console.error('Test Task Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
