import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  let curId = array.length;
  while (0 !== curId) {
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

export async function POST() {
  try {
    // 1. Fetch all teams
    const { data: teams, error: teamErr } = await supabase.from('teams').select('id');
    if (teamErr) throw teamErr;

    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: false, message: 'No teams found' });
    }

    // 2. Fetch all tasks
    const { data: tasks, error: taskErr } = await supabase.from('tasks').select('id').lte('task_number', 10);
    if (taskErr) throw taskErr;

    // 3. Optional: Clear existing active tasks if starting a fresh round
    // (This step depends on business logic; here we assume we are starting a completely fresh assignment)
    // For safety, we only assign to teams that DON'T have an active task right now.

    const { data: activeAssignments, error: actErr } = await supabase
      .from('team_tasks')
      .select('team_id, task_id')
      .eq('is_active', true);
    if (actErr) throw actErr;

    const activeTeamIds = activeAssignments.map(a => a.team_id);
    const activeTaskIds = activeAssignments.map(a => a.task_id);

    // Teams that need assignments
    const teamsNeedingTasks = teams.filter(t => !activeTeamIds.includes(t.id));
    
    // Tasks available to be assigned (Pool of phase 1 tasks)
    let availableTasks = [...tasks];

    if (teamsNeedingTasks.length === 0) {
      return NextResponse.json({ success: true, message: 'All teams already have active tasks' });
    }

    // Shuffle the available tasks to assign them randomly
    availableTasks = shuffleArray([...availableTasks]);

    const newAssignments = [];
    for (let i = 0; i < teamsNeedingTasks.length; i++) {
      const team = teamsNeedingTasks[i];
      // Loop through available tasks to ensure random distribution, repeating if necessary
      const task = availableTasks[i % availableTasks.length];

      newAssignments.push({
        team_id: team.id,
        task_id: task.id,
        is_active: true,
        status: 'Assigned'
      });
    }

    // Insert all assignments in bulk
    if (newAssignments.length > 0) {
      const { error: insertErr } = await supabase
        .from('team_tasks')
        .insert(newAssignments);
        
      if (insertErr) throw insertErr;
    }

    // Also update event_state to running
    await supabase.from('event_state').update({ is_active: true, timer_running: true, start_time: new Date().toISOString() }).neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({ 
      success: true, 
      message: `Started event and assigned ${newAssignments.length} random tasks.` 
    });

  } catch (error) {
    console.error('Start Event Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
