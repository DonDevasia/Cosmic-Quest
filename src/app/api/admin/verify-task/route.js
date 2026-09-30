import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function POST(request) {
  try {
    const { teamId, taskId, action, feedback } = await request.json(); // action is 'approve' or 'reject'

    if (!teamId || !taskId || !action) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'reject') {
      const { error: rejectErr } = await supabase
        .from('team_tasks')
        .update({
          status: 'In Progress',
          admin_feedback: feedback || 'Rejected by Admin',
          submission_payload: null // Clear payload so they can submit again
        })
        .eq('team_id', teamId)
        .eq('task_id', taskId);

      if (rejectErr) throw rejectErr;
      return NextResponse.json({ success: true, message: 'Task rejected. Team can retry.' });
    }

    if (action === 'approve') {
      // 1. Get task base points
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .select('base_points')
        .eq('id', taskId)
        .single();
        
      if (taskErr || !task) throw taskErr || new Error("Task not found");

      // 2. Mark task as Completed (Keep is_active true so timer can expire and client shows waiting for next task)
      const { error: completeErr } = await supabase
        .from('team_tasks')
        .update({
          status: 'Completed',
          completed_at: new Date().toISOString(),
          points_awarded: task.base_points,
          admin_feedback: 'Approved'
        })
        .eq('team_id', teamId)
        .eq('task_id', taskId);

      if (completeErr) throw completeErr;

      // 3. Update team score
      const { data: teamData, error: teamFetchErr } = await supabase
        .from('teams')
        .select('total_score')
        .eq('id', teamId)
        .single();
        
      if (!teamFetchErr && teamData) {
        await supabase
          .from('teams')
          .update({ total_score: teamData.total_score + task.base_points })
          .eq('id', teamId);
      }

      return NextResponse.json({ success: true, message: 'Task Approved. Waiting for timer to expire.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Verify Task Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
