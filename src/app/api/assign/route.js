import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId } = await request.json();

    // 1. Fetch all tasks
    const { data: allTasks, error: taskErr } = await supabase.from('tasks').select('id');
    if (taskErr) throw taskErr;

    // 2. Fetch tasks this team has already interacted with (completed or in progress)
    const { data: teamHistory, error: histErr } = await supabase
      .from('team_tasks')
      .select('task_id')
      .eq('team_id', teamId);
    if (histErr) throw histErr;
    const completedTaskIds = teamHistory.map(t => t.task_id);

    // 3. Fetch currently active tasks for ALL other teams
    const { data: activeTasks, error: actErr } = await supabase
      .from('team_tasks')
      .select('task_id')
      .eq('is_active', true);
    if (actErr) throw actErr;
    const activeTaskIds = activeTasks.map(t => t.task_id);

    // 4. Determine available tasks for this team
    const availableTasks = allTasks.filter(t => 
      !completedTaskIds.includes(t.id) && !activeTaskIds.includes(t.id)
    );

    if (availableTasks.length === 0) {
      return NextResponse.json({ success: false, message: 'No available tasks right now' });
    }

    // 5. Randomly assign one
    const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];

    // 6. Insert assignment (using a transaction-like RPC is better in Postgres, but doing it simple here for MVP)
    const { error: insertErr } = await supabase
      .from('team_tasks')
      .insert([{
        team_id: teamId,
        task_id: randomTask.id,
        is_active: true,
        status: 'In Progress'
      }]);

    if (insertErr) {
      // Catch race condition (unique index violation on task_id or team_id where is_active=true)
      if (insertErr.code === '23505') {
        return NextResponse.json({ success: false, message: 'Collision assigning task, try again' }, { status: 409 });
      }
      throw insertErr;
    }

    return NextResponse.json({ success: true, assignedTaskId: randomTask.id });

  } catch (error) {
    console.error('Assignment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
