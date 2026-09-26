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

export async function POST(request) {
  try {
    const { teamId, taskId, keyword, isExpired } = await request.json();
    const cleanKeyword = keyword ? keyword.trim().toUpperCase() : '';

    if (!teamId || !taskId || (!cleanKeyword && !isExpired)) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the keyword against the tasks table
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('completion_keyword, base_points')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    if (!isExpired) {
      const dbKeyword = task.completion_keyword ? task.completion_keyword.trim().toUpperCase() : '';

      if (dbKeyword && cleanKeyword !== dbKeyword) {
        return NextResponse.json({ success: false, message: 'Access Denied: Invalid Keyword' }, { status: 400 });
      }
    }

    // 2. Mark the current task as completed or failed in team_tasks
    const { error: completeErr } = await supabase
      .from('team_tasks')
      .update({
        is_active: false,
        status: isExpired ? 'Failed' : 'Completed',
        completed_at: new Date().toISOString(),
        points_awarded: isExpired ? 0 : task.base_points
      })
      .eq('team_id', teamId)
      .eq('task_id', taskId);

    if (completeErr) {
      throw completeErr;
    }

    // 3. Update the team's total score ONLY if they succeeded
    if (!isExpired) {
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
    }

    // 4. Find the next task to assign
    // Get all tasks this team has already been assigned (completed or failed)
    const { data: pastTasks, error: pastErr } = await supabase
      .from('team_tasks')
      .select('task_id')
      .eq('team_id', teamId);
      
    if (pastErr) throw pastErr;
    
    const pastTaskIds = pastTasks.map(t => t.task_id);

    // Get all available tasks
    const { data: allTasks, error: allTaskErr } = await supabase
      .from('tasks')
      .select('id');
      
    if (allTaskErr) throw allTaskErr;

    // Filter out tasks the team has already done
    let availableTasks = allTasks.filter(t => !pastTaskIds.includes(t.id));

    if (availableTasks.length === 0) {
      // The team has completed all tasks!
      return NextResponse.json({ success: true, message: 'All missions completed!' });
    }

    // Pick a random available task
    availableTasks = shuffleArray([...availableTasks]);
    const nextTask = availableTasks[0];

    // 5. Assign the new task
    const { error: assignErr } = await supabase
      .from('team_tasks')
      .insert([{
        team_id: teamId,
        task_id: nextTask.id,
        is_active: true,
        status: 'Assigned'
      }]);

    if (assignErr) throw assignErr;

    return NextResponse.json({ success: true, message: 'Transfer Complete' });

  } catch (error) {
    console.error('Submit Task Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
