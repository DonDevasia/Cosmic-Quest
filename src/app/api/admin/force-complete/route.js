import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ success: false, message: 'Missing team ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('team_tasks')
      .select('task_id')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, message: 'This team has no currently active task.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, taskId: data.task_id });

  } catch (error) {
    console.error('Force Complete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
