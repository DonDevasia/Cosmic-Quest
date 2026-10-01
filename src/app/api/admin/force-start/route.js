import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ success: false, message: 'Missing teamId' }, { status: 400 });
    }

    // 1. Get the team's currently active task
    const { data: assignment, error: fetchErr } = await supabase
      .from('team_tasks')
      .select('task_id, status')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (fetchErr || !assignment) {
      return NextResponse.json({ success: false, message: 'No active task found for this team' }, { status: 404 });
    }

    if (assignment.status !== 'Assigned') {
      return NextResponse.json({ success: false, message: 'Task is already in progress or completed.' }, { status: 400 });
    }

    // 2. Fetch the task details to check phase and get base points
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('task_number, base_points')
      .eq('id', assignment.task_id)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ success: false, message: 'Task data not found' }, { status: 404 });
    }

    // 3. Mark the current task as In Progress in team_tasks and start timer
    const isPhase1 = task.task_number <= 10;
    
    const updateData = {
      status: 'In Progress',
      started_at: new Date().toISOString()
    };
    
    if (isPhase1) {
      updateData.points_awarded = 100;
    }

    const { error: completeErr } = await supabase
      .from('team_tasks')
      .update(updateData)
      .eq('team_id', teamId)
      .eq('task_id', assignment.task_id);

    if (completeErr) {
      throw completeErr;
    }

    if (isPhase1) {
      // Update team total score directly
      const { data: teamData, error: teamFetchErr } = await supabase
        .from('teams')
        .select('total_score')
        .eq('id', teamId)
        .single();
        
      if (!teamFetchErr && teamData) {
        await supabase
          .from('teams')
          .update({ total_score: teamData.total_score + 100 })
          .eq('id', teamId);
      }
    }

    return NextResponse.json({ success: true, message: 'Task Successfully Force Started!' });
  } catch (error) {
    console.error('Force Start Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
