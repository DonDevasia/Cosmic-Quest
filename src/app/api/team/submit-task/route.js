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
      .select('completion_keyword, base_points, task_number')
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

    // Fetch current assignment to know its status
    const { data: currentAssignment, error: currErr } = await supabase
      .from('team_tasks')
      .select('status, points_awarded')
      .eq('team_id', teamId)
      .eq('task_id', taskId)
      .single();

    if (currErr || !currentAssignment) {
      return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    const wasAlreadyCompleted = currentAssignment.status === 'Completed';



    let shouldAssignNextTask = false;

    if (!isExpired) {
      // TEAM SUBMITTED KEYWORD CORRECTLY
      if (wasAlreadyCompleted) {
        return NextResponse.json({ success: true, message: 'Task already completed.' });
      }

      const isPhase2 = task.task_number > 10;
      let pointsToAward = task.base_points;

      // Dynamic scoring for Final Destination
      if (task.task_number === 14) {
        const { data: previousWinners, error: countErr } = await supabase
          .from('team_tasks')
          .select('id')
          .eq('task_id', taskId)
          .eq('status', 'Completed');

        if (!countErr && previousWinners) {
          const completedCount = previousWinners.length;
          // 1st gets 9000, 2nd gets 8500, 3rd 8000, etc.
          pointsToAward = Math.max(0, 9000 - (completedCount * 500));
        }
      }

      // Mark the task as Completed, award points. Keep is_active=true if Phase 1 so they wait for timer. 
      // If Phase 2, mark is_active=false immediately.
      const { error: completeErr } = await supabase
        .from('team_tasks')
        .update({
          status: 'Completed',
          is_active: isPhase2 ? false : true,
          completed_at: new Date().toISOString(),
          points_awarded: (currentAssignment.points_awarded || 0) + pointsToAward
        })
        .eq('team_id', teamId)
        .eq('task_id', taskId);

      if (completeErr) throw completeErr;

      // Update the team's total score
      const { data: teamData, error: teamFetchErr } = await supabase
        .from('teams')
        .select('total_score')
        .eq('id', teamId)
        .single();
        
      if (!teamFetchErr && teamData) {
        await supabase
          .from('teams')
          .update({ total_score: teamData.total_score + pointsToAward })
          .eq('id', teamId);
      }

      if (!isPhase2) {
        return NextResponse.json({ success: true, message: 'Keyword Accepted. Waiting for timer.' });
      }
      
      shouldAssignNextTask = true;

    } else {
      // MASTER TIMER EXPIRED
      // If not already completed, mark as Failed. Mark is_active = false.
      const { error: finalizeErr } = await supabase
        .from('team_tasks')
        .update({
          is_active: false,
          status: wasAlreadyCompleted ? 'Completed' : 'Failed',
          points_awarded: wasAlreadyCompleted ? currentAssignment.points_awarded : 0
        })
        .eq('team_id', teamId)
        .eq('task_id', taskId);

      if (finalizeErr) throw finalizeErr;
      shouldAssignNextTask = true;
    }

    if (shouldAssignNextTask) {
      // Assign the next task
      const { data: pastTasks, error: pastErr } = await supabase
        .from('team_tasks')
        .select('task_id')
        .eq('team_id', teamId);
        
      if (pastErr) throw pastErr;
      
      const pastTaskIds = pastTasks.map(t => t.task_id);

      const { data: allTasks, error: allTaskErr } = await supabase
        .from('tasks')
        .select('id, task_number');
        
      if (allTaskErr) throw allTaskErr;

      const completedTaskNumbers = pastTasks
        .map(t => allTasks.find(a => a.id === t.task_id)?.task_number)
        .filter(n => n !== undefined);

      const phase1Completed = [1,2,3,4,5,6,7,8,9,10].every(num => completedTaskNumbers.includes(num));
      const currentTaskNumber = task.task_number;

      let nextTask = null;

      // If they are already in Phase 2, just give them the next Phase 2 task in sequence!
      if (currentTaskNumber >= 11) {
        if (currentTaskNumber === 11) nextTask = allTasks.find(t => t.task_number === 12);
        else if (currentTaskNumber === 12) nextTask = allTasks.find(t => t.task_number === 13);
        else if (currentTaskNumber === 13) nextTask = allTasks.find(t => t.task_number === 14);
        else nextTask = null; // Completed Final Destination
      } else if (!phase1Completed) {
        let availableTasks = allTasks.filter(t => t.task_number <= 10 && !pastTaskIds.includes(t.id));
        if (availableTasks.length > 0) {
          availableTasks = shuffleArray([...availableTasks]);
          nextTask = availableTasks[0];
        }
      } else {
        if (!completedTaskNumbers.includes(11)) {
          nextTask = allTasks.find(t => t.task_number === 11);
        } else if (!completedTaskNumbers.includes(12)) {
          nextTask = allTasks.find(t => t.task_number === 12);
        } else if (!completedTaskNumbers.includes(13)) {
          nextTask = allTasks.find(t => t.task_number === 13);
        } else if (!completedTaskNumbers.includes(14)) {
          nextTask = allTasks.find(t => t.task_number === 14);
        }
      }

      if (!nextTask) {
        return NextResponse.json({ success: true, message: 'All missions completed! / Final Destination reached!' });
      }

      const { error: assignErr } = await supabase
        .from('team_tasks')
        .insert([{
          team_id: teamId,
          task_id: nextTask.id,
          is_active: true,
          status: 'Assigned'
        }]);

      if (assignErr) throw assignErr;

      return NextResponse.json({ success: true, message: 'Next Task Assigned.' });
    }

  } catch (error) {
    console.error('Submit Task Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
