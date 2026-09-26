import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { teamId, taskId, pointsChange, reason } = await request.json();

    // 1. Validate Admin Session
    // const { data: { session } } = await supabase.auth.getSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Insert Score History
    const { data: history, error: historyError } = await supabase
      .from('score_history')
      .insert([{ team_id: teamId, task_id: taskId, points_change: pointsChange, reason }]);

    if (historyError) throw historyError;

    // 3. Update Team Total Score (Can also be done via Postgres trigger)
    // For now, assuming a trigger handles it, or we do a simple RPC call
    
    return NextResponse.json({ success: true, message: `Added ${pointsChange} points` });
  } catch (error) {
    console.error('Score Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
