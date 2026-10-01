import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId, taskId, keyword } = await request.json();
    const cleanKeyword = keyword ? keyword.trim().toUpperCase() : '';

    if (!teamId || !taskId || !cleanKeyword) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the venue keyword against the tasks table
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('start_keyword, task_number')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    const dbKeyword = task.start_keyword ? task.start_keyword.trim().toUpperCase() : '';

    if (dbKeyword && cleanKeyword !== dbKeyword) {
      return NextResponse.json({ success: false, message: 'Invalid Venue QR Code' }, { status: 400 });
    }

    // 2. Mark the current task as In Progress in team_tasks and start timer
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
      .eq('task_id', taskId)
      .eq('status', 'Assigned'); // Only update if it's currently Assigned

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

    return NextResponse.json({ success: true, message: 'Venue Verified. Task Started. +100 Points Awarded!' });

  } catch (error) {
    console.error('Start Task Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
