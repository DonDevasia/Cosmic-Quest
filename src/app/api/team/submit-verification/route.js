import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId, taskId, payload } = await request.json();

    if (!teamId || !taskId || !payload) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Mark the current task as Submitted and save the payload
    const { error: completeErr } = await supabase
      .from('team_tasks')
      .update({
        status: 'Submitted',
        submission_payload: payload,
        admin_feedback: null // Clear any previous feedback
      })
      .eq('team_id', teamId)
      .eq('task_id', taskId);

    if (completeErr) {
      throw completeErr;
    }

    return NextResponse.json({ success: true, message: 'Verification Submitted Successfully' });

  } catch (error) {
    console.error('Submit Verification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
